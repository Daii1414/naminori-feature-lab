// Feature 1: Dubbing Antidote content script.

const settings = { dubbingAntidoteEnabled: true };
let lastHandledVideoId = null;
let runInFlight = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadSettings() {
  const stored = await chrome.storage.sync.get(["dubbingAntidoteEnabled"]);
  if (typeof stored.dubbingAntidoteEnabled === "boolean") {
    settings.dubbingAntidoteEnabled = stored.dubbingAntidoteEnabled;
  }
  console.debug("[JP Immersion][content] settings loaded", settings);
}

function isWatchPage() {
  return location.pathname === "/watch";
}

function getVideoId() {
  return new URL(location.href).searchParams.get("v");
}

async function waitForPlayerElement(timeoutMs = 8000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeoutMs) {
    attempt++;
    const player = document.querySelector("ytd-player .html5-video-player") ||
      document.getElementById("movie_player");
    if (player) {
      console.debug("[JP Immersion][content] player found", { attempt });
      return player;
    }
    await sleep(200);
  }
  console.warn("[JP Immersion][content] player not found");
  return null;
}

async function runDubbingAntidote(trigger) {
  console.debug("[JP Immersion][content] runDubbingAntidote triggered by:", trigger, { url: location.href });

  if (!settings.dubbingAntidoteEnabled || !isWatchPage()) return;

  const videoId = getVideoId();
  if (!videoId) return;

  if (videoId === lastHandledVideoId || runInFlight) {
    console.debug("[JP Immersion][content] skipped", { videoId, reason: runInFlight ? "run already in flight" : "already handled" });
    return;
  }

  runInFlight = true;
  try {
    console.debug("[JP Immersion][content] watch page detected", { videoId });
    const player = await waitForPlayerElement();
    if (!player) return;

    console.debug("[JP Immersion][content] sending SWITCH_TO_JAPANESE_AUDIO message");
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: "SWITCH_TO_JAPANESE_AUDIO" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("[JP Immersion][content] message failed", chrome.runtime.lastError.message);
          resolve({ success: false, reason: "message_failed", error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response);
      });
    });

    console.debug("[JP Immersion][content] final result from service worker:", result);
    lastHandledVideoId = videoId;
  } finally {
    runInFlight = false;
  }
}

async function init() {
  console.debug("[JP Immersion][content] content script initialized", { url: location.href });
  await loadSettings();
  runDubbingAntidote("initial_page_load");

  document.addEventListener("yt-navigate-finish", () => {
    runDubbingAntidote("yt-navigate-finish");
  });

  // YouTube SPA navigation can be inconsistent across builds.
  setInterval(() => {
    if (!isWatchPage()) return;
    const videoId = getVideoId();
    if (videoId && videoId !== lastHandledVideoId && !runInFlight) {
      runDubbingAntidote("video_id_poll");
    }
  }, 1000);
}

init();
