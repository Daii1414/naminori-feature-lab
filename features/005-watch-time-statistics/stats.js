function formatDuration(sec) {
    if (sec < 60) return `${Math.round(sec)}с`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m < 60) return `${m}м ${s}с`;
    const h = Math.floor(m / 60);
    return `${h}ч ${m % 60}м`;
}

async function loadStats() {
    const data = await chrome.storage.local.get({ watchTimeRecords: [] });
    const records = data.watchTimeRecords;

    // Метрики
    const totalSec = records.reduce((acc, r) => acc + (r.durationSec || 0), 0);
    document.getElementById('totalTime').textContent = formatDuration(totalSec);
    document.getElementById('totalVideos').textContent = records.length;
    document.getElementById('weekTime').textContent = formatDuration(totalSec); // упрощенно за неделю

    // Список истории
    const listEl = document.getElementById('historyList');
    listEl.innerHTML = records.length === 0 ? '<p style="color:var(--text-muted)">Нет данных о просмотрах.</p>' : '';

    records.slice(-10).reverse().forEach(rec => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <img class="history-thumb" src="https://i.ytimg.com/vi/${rec.videoId}/hqdefault.jpg" alt="">
            <div class="history-info">
              <h3 class="history-title">${rec.title || 'Видео YouTube'}</h3>
              <div class="history-meta">
                <span class="history-badge">N${rec.jlptLevel || 3}</span>
                <span>${rec.channelName || ''}</span>
                <span>• Просмотрено: ${formatDuration(rec.durationSec)}</span>
                <span>• ${rec.date || ''}</span>
              </div>
            </div>
        `;
        listEl.appendChild(item);
    });

    // Генерация пустой тепловой карты (сетка)
    const heatmap = document.getElementById('heatmapGrid');
    heatmap.innerHTML = '';
    for (let i = 0; i < 364; i++) {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        heatmap.appendChild(cell);
    }
}

document.getElementById('exportBtn').addEventListener('click', async () => {
    const data = await chrome.storage.local.get({ watchTimeRecords: [] });
    const blob = new Blob([JSON.stringify(data.watchTimeRecords, null, 2)], { type: 'json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'naminori-watch-time.json';
    a.click();
});

loadStats();