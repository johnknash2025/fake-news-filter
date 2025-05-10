const axios = require('axios');
const Parser = require('rss-parser');
const { Configuration, OpenAIApi } = require('openai');
const faunadb = require('faunadb');

// FaunaDB接続設定（データベース用）
const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

// OpenAI API設定
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// RSSパーサー設定
const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['content:encoded', 'contentEncoded']
    ],
  }
});

// RSSフィードのURL
const RSS_FEEDS = [
  {
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    source: 'Yahoo! ニュース'
  },
  {
    url: 'https://www3.nhk.or.jp/rss/news/cat0.xml',
    source: 'NHK'
  },
  // 他のRSSフィードも追加可能
];

exports.handler = async function(event, context) {
  try {
    // リクエストパラメータを取得
    const params = event.queryStringParameters || {};
    const forceRefresh = params.refresh === 'true';
    
    // キャッシュからニュースを取得（強制更新でない場合）
    if (!forceRefresh) {
      try {
        const cachedNewsRef = await client.query(
          q.Get(q.Match(q.Index('news_by_type'), 'latest'))
        );
        
        const cachedNews = cachedNewsRef.data;
        
        // キャッシュが新しい場合（1時間以内）はそれを使用
        if (cachedNews && cachedNews.timestamp > Date.now() - 3600000) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
              news: cachedNews.items,
              fromCache: true,
              timestamp: cachedNews.timestamp
            })
          };
        }
      } catch (err) {
        // キャッシュが見つからない場合はエラーを無視
        console.log('キャッシュが見つからないか期限切れです。新しいニュースを取得します。');
      }
    }
    
    // 新しいニュースを取得
    const newsItems = [];
    const filteredOut = [];
    let totalFetched = 0;
    
    for (const feed of RSS_FEEDS) {
      try {
        const response = await axios.get(feed.url);
        const parsedFeed = await parser.parseString(response.data);
        
        // 各アイテムをフィルタリング
        for (const item of parsedFeed.items) {
          totalFetched++;
          
          // コンテンツの内容
          const title = item.title || '';
          const description = item.contentEncoded || item.content || item.description || '';
          
          // AIによるフィルタリング
          const isFakeNews = await analyzeContent(title, description);
          
          if (isFakeNews) {
            filteredOut.push({
              title,
              source: feed.source,
              pubDate: item.pubDate
            });
          } else {
            newsItems.push({
              title,
              link: item.link,
              description: stripHtml(description).substring(0, 300) + '...',
              pubDate: item.pubDate,
              source: feed.source
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching feed ${feed.url}:`, error);
      }
    }
    
    // 統計データを保存
    const statsData = {
      totalFetched,
      filteredOut: filteredOut.length,
      timestamp: Date.now()
    };
    
    try {
      await client.query(
        q.Create(q.Collection('stats'), {
          data: statsData
        })
      );
    } catch (err) {
      console.error('統計データの保存に失敗:', err);
    }
    
    // 結果をキャッシュに保存
    try {
      await client.query(
        q.If(
          q.Exists(q.Match(q.Index('news_by_type'), 'latest')),
          q.Update(
            q.Select('ref', q.Get(q.Match(q.Index('news_by_type'), 'latest'))),
            { data: { items: newsItems, timestamp: Date.now() } }
          ),
          q.Create(q.Collection('news'), {
            data: {
              type: 'latest',
              items: newsItems,
              timestamp: Date.now()
            }
          })
        )
      );
    } catch (err) {
      console.error('ニュースデータのキャッシュに失敗:', err);
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        news: newsItems,
        timestamp: Date.now(),
        stats: {
          totalFetched,
          filteredOut: filteredOut.length
        }
      })
    };
  } catch (error) {
    console.error('エラー:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// AIを使ってコンテンツを分析する関数
async function analyzeContent(title, description) {
  try {
    // HTMLを除去してプレーンテキストに
    const plainText = stripHtml(description);
    
    // 分析するテキストを作成（長すぎる場合は切り詰める）
    const textToAnalyze = `タイトル: ${title}\n内容: ${plainText.substring(0, 1000)}`;
    
    // OpenAI APIを使用してフェイクニュース判定
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "あなたはフェイクニュース検出AIです。与えられたニュース記事がフェイクニュースかどうかを判断し、true（フェイクニュース）またはfalse（信頼できるニュース）のみで回答してください。"
        },
        {
          role: "user",
          content: `このニュース記事はフェイクニュースですか？\n\n${textToAnalyze}`
        }
      ],
      max_tokens: 5,
      temperature: 0.1
    });
    
    const result = response.data.choices[0].message.content.trim().toLowerCase();
    return result.includes('true');
  } catch (error) {
    console.error('AI分析エラー:', error);
    return false; // エラーの場合はフィルタリングしない
  }
}

// HTMLタグを除去する関数
function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}