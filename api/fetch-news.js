import Parser from 'rss-parser';
const parser = new Parser();

const RSS_FEEDS = [
  { url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml', source: 'Yahoo!ニュース' },
  { url: 'https://www3.nhk.or.jp/rss/news/cat0.xml', source: 'NHK' },
  { url: 'https://export.arxiv.org/rss/cs', source: 'arXiv (Computer Science)' },
  { url: 'https://www.nature.com/nature.rss', source: 'Nature' },
  { url: 'https://www.sciencemag.org/rss/news_current.xml', source: 'Science' }
];

export default async function handler(req, res) {
  try {
    let news = [];
    for (const feed of RSS_FEEDS) {
      const parsed = await parser.parseURL(feed.url);
      news = news.concat(
        parsed.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: feed.source,
          contentSnippet: item.contentSnippet
        }))
      );
    }
    res.status(200).json({ news });
  } catch (error) {
    res.status(500).json({ error: 'RSS取得に失敗しました', detail: error.message });
  }
}