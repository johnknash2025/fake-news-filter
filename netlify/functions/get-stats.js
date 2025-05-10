const faunadb = require('faunadb');

// FaunaDB接続設定
const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

exports.handler = async function(event, context) {
  try {
    // 最新のニュースデータを取得
    const newsRef = await client.query(
      q.Get(q.Match(q.Index('news_by_type'), 'latest'))
    );
    
    // 最近の統計データを取得（直近7日間の平均）
    const startDate = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7日前
    
    const statsRefs = await client.query(
      q.Map(
        q.Paginate(
          q.Range(
            q.Match(q.Index('stats_by_timestamp')),
            q.Time(startDate.toString()),
            q.Time(Date.now().toString())
          )
        ),
        q.Lambda('time', q.Get(q.Var('time')))
      )
    );
    
    // 統計データを集計
    const stats = statsRefs.data.map(ref => ref.data);
    
    // 集計結果
    let totalFetched = 0;
    let totalFiltered = 0;
    
    stats.forEach(stat => {
      totalFetched += stat.totalFetched || 0;
      totalFiltered += stat.filteredOut || 0;
    });
    
    // ニュースソースの数を計算
    const newsItems = newsRef.data.items || [];
    const sources = new Set(newsItems.map(item => item.source));
    
    // レスポンスデータを作成
    const responseData = {
      totalFetched,
      filteredOut: totalFiltered,
      filterRate: totalFetched > 0 ? Math.round((totalFiltered / totalFetched) * 100) + '%' : '0%',
      sourcesCount: sources.size,
      lastUpdated: newsRef.data.timestamp
    };
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responseData)
    };
  } catch (error) {
    console.error('統計データ取得エラー:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },