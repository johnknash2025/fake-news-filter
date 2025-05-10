const fs = require('fs');
const path = require('path');
const faunadb = require('faunadb');

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNA_SECRET_KEY
});

module.exports = async (req, res) => {
  try {
    // 最新のニュースデータを取得
    const newsRef = await client.query(
      q.Get(q.Match(q.Index('news_by_type'), 'latest'))
    );

    // 最近の統計データを取得（直近7日間の平均）
    const startDate = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)); // 7日前
    const endDate = new Date();

    const statsRefs = await client.query(
      q.Map(
        q.Paginate(
          q.Range(
            q.Match(q.Index('stats_by_timestamp')),
            q.Time(startDate.toISOString()),
            q.Time(endDate.toISOString())
          )
        ),
        q.Lambda('time', q.Get(q.Var('time')))
      )
    );

    const stats = statsRefs.data.map(ref => ref.data);
    let totalFetched = 0;
    let totalFiltered = 0;
    stats.forEach(stat => {
      totalFetched += stat.totalFetched || 0;
      totalFiltered += stat.filteredOut || 0;
    });
    const newsItems = newsRef.data.items || [];
    const sources = new Set(newsItems.map(item => item.source));
    const responseData = {
      totalFetched,
      filteredOut: totalFiltered,
      filterRate: totalFetched > 0 ? Math.round((totalFiltered / totalFetched) * 100) + '%' : '0%',
      sourcesCount: sources.size,
      lastUpdated: newsRef.data.timestamp
    };

    // public/stats.json に書き込み
    const publicDir = path.join(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    fs.writeFileSync(path.join(publicDir, 'stats.json'), JSON.stringify(responseData, null, 2));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('統計データ更新エラー:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ error: '統計データの更新に失敗しました' });
  }
};
