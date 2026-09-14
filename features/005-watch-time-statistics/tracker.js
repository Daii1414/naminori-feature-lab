console.log("[Naminori WatchTime] Tracker active");

let trackedVideo = null;
let watchSeconds = 0;
let lastTime = null;
let timerInterval = null;

function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
}

function startTracking() {
    const video = document.querySelector('video');
    if (!video || video === trackedVideo) return;

    trackedVideo = video;
    watchSeconds = 0;
    lastTime = video.currentTime;

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (!video.paused && !video.ended && document.visibilityState === 'visible') {
            const dt = video.currentTime - lastTime;
            if (dt > 0 && dt < 2) { // исключаем перемотки
                watchSeconds += dt;
            }
        }
        lastTime = video.currentTime;

        // Каждые 10 секунд сохраняем прогресс в фоновое хранилище
        if (watchSeconds >= 10) {
            saveWatchTime(Math.round(watchSeconds));
            watchSeconds = 0;
        }
    }, 1000);
}

async function saveWatchTime(sec) {
    const videoId = getQueryParams();
    if (!videoId) return;

    const title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string')?.textContent || document.title;
    const channelName = document.querySelector('ytd-channel-name yt-formatted-string a')?.textContent || '';

    const data = await chrome.storage.local.get({ watchTimeRecords: [] });
    const records = data.watchTimeRecords;

    const existing = records.find(r => r.videoId === videoId);
    if (existing) {
        existing.durationSec = (existing.durationSec || 0) + sec;
        existing.date = new Date().toISOString().split('T')[0];
    } else {
        records.push({
            videoId,
            title,
            channelName,
            jlptLevel: 2, // по умолчанию или определяемый
            durationSec: sec,
            date: new Date().toISOString().split('T')[0]
        });
    }

    await chrome.storage.local.set({ watchTimeRecords: records });
}

const observer = new MutationObserver(() => {
    startTracking();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
startTracking();