console.log("[Naminori Lab] 005-jlpt-difficulty-badge active");

const YT_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
const analysisCache = new Map();
const inFlightPromises = new Map();

// Замки от дублирования запросов и элементов
let activeWatchVideoId = null;

function extractVideoId(cardOrUrl) {
    if (typeof cardOrUrl === "string") {
        const match = cardOrUrl.match(/(?:\?v=|\/shorts\/)([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }
    const link = cardOrUrl.querySelector('a[href*="watch?v="], a[href*="/shorts/"]');
    if (!link) return null;
    const href = link.getAttribute("href") || link.href || "";
    const match = href.match(/(?:\?v=|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

async function fetchCaptionTracks(videoId) {
    try {
        const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${YT_API_KEY}&prettyPrint=false`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                context: {
                    client: { clientName: "IOS", clientVersion: "20.11.6", hl: "ja", gl: "JP" }
                },
                videoId: videoId
            })
        });

        if (!res.ok) return null;
        const data = await res.json();
        const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!tracks || tracks.length === 0) return null;

        const ja = tracks.find(t => t.languageCode === "ja" && t.kind !== "asr") 
                || tracks.find(t => t.languageCode === "ja");

        if (!ja || !ja.baseUrl) return null;
        return { url: ja.baseUrl, isAuto: ja.kind === "asr" };
    } catch { return null; }
}

async function downloadTranscript(baseUrl) {
    try {
        const res = await fetch(baseUrl);
        if (!res.ok) return null;
        const xml = await res.text();

        const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
        const textRegex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
        const clean = str => str.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10))).replace(/&amp;/g, "&").replace(/<[^>]+>/g, "").trim();

        let segments = [];
        let m;
        while ((m = pRegex.exec(xml)) !== null) {
            const startMs = parseInt(m[1], 10);
            const durMs = parseInt(m[2], 10);
            const text = clean(m[3]);
            if (text) segments.push({ startMs, endMs: startMs + durMs, text });
        }
        if (segments.length === 0) {
            while ((m = textRegex.exec(xml)) !== null) {
                const startMs = Math.round(parseFloat(m[1]) * 1000);
                const durMs = Math.round(parseFloat(m[2]) * 1000);
                const text = clean(m[3]);
                if (text) segments.push({ startMs, endMs: startMs + durMs, text });
            }
        }
        return segments;
    } catch { return null; }
}

async function getStatsForVideo(videoId) {
    if (analysisCache.has(videoId)) return analysisCache.get(videoId);
    if (inFlightPromises.has(videoId)) return inFlightPromises.get(videoId);

    const promise = (async () => {
        const track = await fetchCaptionTracks(videoId);
        if (!track) return null;
        const segments = await downloadTranscript(track.url);
        if (!segments) return null;
        const stats = analyzeTranscript(segments);
        if (!stats) return null;
        return { ...stats, isAuto: track.isAuto };
    })();

    inFlightPromises.set(videoId, promise);
    try {
        const res = await promise;
        analysisCache.set(videoId, res);
        return res;
    } finally {
        inFlightPromises.delete(videoId);
    }
}

/**
 * 1. Отрисовка бейджа в ленте (с защитой от дублей внутри карточки)
 */
function applyCardBadge(card, videoId) {
    if (card.querySelector(".nt-jlpt-badge")) return;

    getStatsForVideo(videoId).then(data => {
        if (!data) return;
        if (card.querySelector(".nt-jlpt-badge")) return;

        const mountPoint = card.querySelector("yt-content-metadata-view-model, #metadata-line, #metadata-container, .YtmCompactMediaItemMetadataContent");
        if (!mountPoint) return;

        const badge = document.createElement("div");
        badge.className = "nt-jlpt-badge";
        badge.textContent = `JLPT N${data.jlptLevel}${data.isAuto ? "*" : ""}`;
        badge.title = `JLPT N${data.jlptLevel} • ${data.wpm} WPM`;
        mountPoint.appendChild(badge);
    });
}

/**
 * 2. Отрисовка панели статистики под видео (с жестким синхронным замком)
 */
function applyWatchPageBox(videoId) {
    const bottomRow = document.querySelector('ytd-watch-metadata #bottom-row');
    if (!bottomRow) return;

    // СИНХРОННЫЙ ЗАМОК: если для этого видео панель уже создана или в процессе — выходим
    if (activeWatchVideoId === videoId || document.querySelector(`.nt-db-wrapper[data-nt-video-id="${videoId}"]`)) {
        return;
    }

    // Ставим замок ДО асинхронного запроса
    activeWatchVideoId = videoId;

    // Удаляем старые панели от прошлых видео, если они остались
    document.querySelectorAll('.nt-db-wrapper').forEach(p => p.remove());

    getStatsForVideo(videoId).then(data => {
        if (!data) {
            activeWatchVideoId = null; // Сбрасываем при неудаче
            return;
        }

        const currentId = extractVideoId(window.location.href);
        if (currentId !== videoId || document.querySelector(`.nt-db-wrapper[data-nt-video-id="${videoId}"]`)) {
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'nt-db-row';
        wrapper.dataset.ntVideoId = videoId;

        const r = data.ratios;
        const segmentsConfig = [
            { key: 'n5', color: '#22c55e', ratio: r.n5 },
            { key: 'n4', color: '#84cc16', ratio: r.n4 },
            { key: 'n3', color: '#eab308', ratio: r.n3 },
            { key: 'n2', color: '#f97316', ratio: r.n2 },
            { key: 'n1', color: '#ef4444', ratio: r.n1 }
        ];

        const barSegments = segmentsConfig.map(seg => {
            if (seg.ratio <= 0) return '';
            return `<div style="width: ${seg.ratio * 100}%; background-color: ${seg.color}; height: 100%;"></div>`;
        }).join('');

        wrapper.innerHTML = `
            <div class="nt-db-badge-col">
              <span style="background: ${getBadgeColor(data.jlptLevel)}; color: #fff; font-weight: 700; font-size: 1.2rem; padding: 2px 6px; border-radius: 4px;">N${data.jlptLevel}${data.isAuto ? '*' : ''}</span>
            </div>
            <div class="nt-db-sep">|</div>
            <div class="nt-db-stat">
              <span class="nt-db-stat-value">${data.wpm}</span>
              <span class="nt-db-stat-label">СЛ/МИН</span>
            </div>
            <div class="nt-db-stat">
              <span class="nt-db-stat-value">${formatNum(data.totalWords)}</span>
              <span class="nt-db-stat-label">СЛОВА</span>
            </div>
            <div class="nt-db-stat">
              <span class="nt-db-stat-value">${formatNum(data.charCount)}</span>
              <span class="nt-db-stat-label">СИМВОЛЫ</span>
            </div>
            <div class="nt-db-stat">
              <span class="nt-db-stat-value">${data.lineDensity}<span class="nt-db-stat-suffix">/лн</span></span>
              <span class="nt-db-stat-label">ПЛОТНОСТЬ</span>
            </div>
            <div class="nt-db-sep">|</div>
            <div class="nt-db-dist">
              <div class="nt-db-dist-bar-row">
                <div class="nt-db-vocab-bar">${barSegments}</div>
              </div>
              <span class="nt-db-dist-label">РАСПРЕДЕЛЕНИЕ</span>
            </div>
        `;

        bottomRow.before(wrapper);
    }).catch(() => {
        activeWatchVideoId = null;
    });
}

function getBadgeColor(lvl) {
    switch(lvl) {
        case 5: return "#22c55e";
        case 4: return "#84cc16";
        case 3: return "#eab308";
        case 2: return "#f97316";
        case 1: return "#ef4444";
        default: return "#606060";
    }
}

function formatNum(n) {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n;
}

/**
 * Сканирование DOM
 */
function scanPage() {
    const cards = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-grid-video-renderer, yt-lockup-view-model');
    cards.forEach(card => {
        if (card.classList.contains('nihongotube-hidden')) return;
        const videoId = extractVideoId(card);
        if (!videoId) return;
        if (card.dataset.ntJlptScanned === videoId) return;
        card.dataset.ntJlptScanned = videoId;
        applyCardBadge(card, videoId);
    });

    if (window.location.pathname.startsWith('/watch')) {
        const watchVideoId = extractVideoId(window.location.href);
        if (watchVideoId) {
            applyWatchPageBox(watchVideoId);
        }
    }
}

let isScheduled = false;
function scheduleScan() {
    if (isScheduled) return;
    isScheduled = true;
    requestAnimationFrame(() => {
        isScheduled = false;
        scanPage();
    });
}

const observer = new MutationObserver(() => {
    scheduleScan();
});

observer.observe(document.documentElement, { childList: true, subtree: true });
scheduleScan();