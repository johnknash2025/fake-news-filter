document.addEventListener('DOMContentLoaded', function() {
    // API エンドポイント（Netlify/Vercel Functions）
    const API_ENDPOINT = '/api/fetch-news';
    const STATS_ENDPOINT = '/api/get-stats';
    
    // DOM 要素の参照
    const newsContainer = document.getElementById('news-container');
    const refreshBtn = document.getElementById('refresh-btn');
    const lastUpdated = document.getElementById('last-updated');
    const sourceSelect = document.getElementById('source-select');
    const statsContainer = document.getElementById('stats-container');
    
    // ニュースを保存する変数
    let allNews = [];
    
    // 初期データ読み込み
    fetchNews();
    fetchStats();
    
    // 更新ボタンのイベントリスナー
    refreshBtn.addEventListener('click', function() {
      fetchNews(true);
      fetchStats();
    });
    
    // ソースフィルターのイベントリスナー
    sourceSelect.addEventListener('change', function() {
      filterNewsBySource(this.value);
    });
    
    // ニュースデータを取得する関数
    async function fetchNews(forceRefresh = false) {
      try {
        // 読み込み中表示
        newsContainer.innerHTML = `
          <div class="loading-indicator">
            <div class="spinner"></div>
            <p>ニュースを読み込み中...</p>
          </div>
        `;
        
        // APIからデータ取得
        const response = await fetch(`${API_ENDPOINT}${forceRefresh ? '?refresh=true' : ''}`);
        
        if (!response.ok) {
          throw new Error('ニュースの取得に失敗しました');
        }
        
        const data = await response.json();
        allNews = data.news || [];
        
        // ニュースソースのリストを取得
        const sources = [...new Set(allNews.map(item => item.source))].sort();
        
        // ソースフィルターを更新
        populateSourceFilter(sources);
        
        // 最終更新日時を表示
        lastUpdated.textContent = new Date().toLocaleString('ja-JP');
        
        // ニュースを表示
        displayNews(allNews);
      } catch (error) {
        console.error('ニュース取得エラー:', error);
        newsContainer.innerHTML = `
          <div class="error-message">
            <p>ニュースの読み込み中にエラーが発生しました。</p>
            <p>エラー詳細: ${error.message}</p>
          </div>
        `;
      }
    }
    
    // 統計情報を取得する関数
    async function fetchStats() {
      try {
        const response = await fetch(STATS_ENDPOINT);
        
        if (!response.ok) {
          throw new Error('統計情報の取得に失敗しました');
        }
        
        const stats = await response.json();
        displayStats(stats);
      } catch (error) {
        console.error('統計取得エラー:', error);
        statsContainer.innerHTML = `
          <div class="error-message">
            <p>統計情報の読み込み中にエラーが発生しました。</p>
          </div>
        `;
      }
    }
    
    // ニュースソースフィルターを更新する関数
    function populateSourceFilter(sources) {
      // 既存のオプションをクリア（allは残す）
      while (sourceSelect.options.length > 1) {
        sourceSelect.remove(1);
      }
      
      // ソースごとにオプションを追加
      sources.forEach(source => {
        const option = document.createElement('option');
        option.value = source;
        option.textContent = source;
        sourceSelect.appendChild(option);
      });
    }
    
    // ニュースを表示する関数
    function displayNews(newsItems) {
      if (newsItems.length === 0) {
        newsContainer.innerHTML = `
          <div class="no-news">
            <p>表示できるニュースはありません。</p>
          </div>
        `;
        return;
      }
      
      // ニュースコンテナをクリア
      newsContainer.innerHTML = '';
      
      // ニュースアイテムをソート（日付の新しい順）
      const sortedNews = [...newsItems].sort((a, b) => {
        return new Date(b.pubDate) - new Date(a.pubDate);
      });
      
      // 各ニュースアイテムを表示
      sortedNews.forEach(item => {
        const newsElement = document.createElement('article');
        newsElement.className = 'news-item';
        
        const pubDate = new Date(item.pubDate);
        const formattedDate = pubDate.toLocaleString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        newsElement.innerHTML = `
          <h3><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></h3>
          <p>${item.description}</p>
          <div class="news-meta">
            <span class="news-source">${item.source || '不明'}</span>
            <span class="news-date">${formattedDate}</span>
          </div>
        `;
        
        newsContainer.appendChild(newsElement);
      });
    }
    
    // 統計情報を表示する関数
    function displayStats(stats) {
      statsContainer.innerHTML = `
        <div class="stat-card">
          <div class="stat-number">${stats.totalFetched || 0}</div>
          <div class="stat-label">取得ニュース数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.filteredOut || 0}</div>
          <div class="stat-label">フィルタリング数</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.filterRate || '0%'}</div>
          <div class="stat-label">フィルタリング率</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-number">${stats.sourcesCount || 0}</div>
          <div class="stat-label">ニュースソース数</div>
        </div>
      `;
    }
    
    // ソースでフィルタリングする関数
    function filterNewsBySource(source) {
      if (source === 'all') {
        displayNews(allNews);
      } else {
        const filtered = allNews.filter(item => item.source === source);
        displayNews(filtered);
      }
    }
  });