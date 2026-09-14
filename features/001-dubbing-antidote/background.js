// Feature 1: Dubbing Antidote
// Switch YouTube's auto-dubbed audio back to the Japanese original track.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SWITCH_TO_JAPANESE_AUDIO") return;

  const tabId = sender.tab?.id;
  if (!tabId) {
    sendResponse({ success: false, reason: "no_tab" });
    return;
  }

  console.debug("[JP Immersion][background] executeScript starting", { tabId, world: "MAIN" });

  chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: switchToJapaneseAudioTrackInPage,
  }).then((results) => {
    const result = results?.[0]?.result ?? { success: false, reason: "no_result" };
    console.debug("[JP Immersion][background] executeScript succeeded", result);
    sendResponse(result);
  }).catch((err) => {
    console.error("[JP Immersion][background] executeScript failed", err);
    sendResponse({ success: false, reason: "injection_failed", error: String(err) });
  });

  return true;
});

function switchToJapaneseAudioTrackInPage() {
  const log = (...args) => console.debug("[JP Immersion][page]", ...args);
  const warn = (...args) => console.warn("[JP Immersion][page]", ...args);

  function findPlayer() {
    return document.querySelector("ytd-player .html5-video-player") ||
      document.getElementById("movie_player");
  }

  function decodeTrackId(track) {
    if (typeof track?.id !== "string") return "";
    const parts = track.id.split(";");
    if (parts.length < 2) return "";

    // The current format is base64/base64url and often has no padding.
    let encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (encoded.length % 4) encoded += "=";

    try {
      return atob(encoded);
    } catch {
      return "";
    }
  }

  function extractLanguageFromDecodedId(decoded) {
    if (!decoded) return null;

    // Current YouTube metadata is protobuf-like binary text. For example:
    // ... original ... lang\x02ja
    // Do not expect ':' or '=' between lang and ja.
    const match = decoded.match(/lang[\x00-\x1f\x7f\s]{0,4}([a-zA-Z]{2,8})/i);
    if (!match) return null;

    const code = match[1].toLowerCase();
    return code === "jpn" ? "ja" : code;
  }

  function analyzeTrack(track, index) {
    const decoded = decodeTrackId(track);
    const structuredLanguage =
      track?.languageCode ||
      track?.audioTrack?.languageCode ||
      track?.captionTrack?.languageCode ||
      null;

    let languageCode = structuredLanguage ? String(structuredLanguage).toLowerCase() : null;
    let source = structuredLanguage ? "structured" : "unknown";

    if (!languageCode) {
      const decodedLanguage = extractLanguageFromDecodedId(decoded);
      if (decodedLanguage) {
        languageCode = decodedLanguage;
        source = "decoded_id_fallback";
      }
    }

    let isOriginal = null;
    if (typeof track?.isAutoDubbed === "boolean") {
      isOriginal = track.isAutoDubbed === false;
    } else if (decoded) {
      if (/dubbed-auto/i.test(decoded)) isOriginal = false;
      else if (/original/i.test(decoded)) isOriginal = true;
    }

    const analysis = {
      index,
      displayName: track?.displayName || "(no displayName)",
      languageCode,
      source,
      isOriginal,
      id: typeof track?.id === "string" ? track.id : null,
    };

    log(`track[${index}] analysis`, analysis);
    if (source === "decoded_id_fallback") {
      log(`track[${index}] decoded metadata`, decoded);
    }
    return { track, ...analysis };
  }

  const player = findPlayer();
  if (!player || typeof player.getAvailableAudioTracks !== "function") {
    warn("player not ready");
    return { success: false, reason: "player_not_ready" };
  }

  log("player found", player);

  const tracks = player.getAvailableAudioTracks();
  log(`getAvailableAudioTracks: ${tracks?.length || 0} track(s)`);

  if (!Array.isArray(tracks) || tracks.length === 0) {
    return { success: true, reason: "no_tracks_available" };
  }

  const analyzed = tracks.map(analyzeTrack);

  const japanese = analyzed.filter((x) =>
    String(x.languageCode || "").toLowerCase().startsWith("ja")
  );

  log(`Japanese track(s) detected: ${japanese.length}`);

  if (japanese.length === 0) {
    warn("no Japanese track detected among available tracks");
    return { success: true, reason: "no_japanese_track" };
  }

  // Prefer Japanese original, then any Japanese track.
  const target =
    japanese.find((x) => x.isOriginal === true) ||
    japanese.find((x) => x.isOriginal !== false) ||
    japanese[0];

  const currentTrack = typeof player.getAudioTrack === "function"
    ? player.getAudioTrack()
    : null;

  if (currentTrack && String(currentTrack.id) === String(target.track.id)) {
    log("already using target track", target);
    return {
      success: true,
      alreadySet: true,
      trackName: target.displayName || "Japanese",
      confident: target.isOriginal === true,
    };
  }

  if (typeof player.setAudioTrack !== "function") {
    return { success: false, reason: "set_audio_track_unavailable" };
  }

  log("calling setAudioTrack", target);
  player.setAudioTrack(target.track);
  log("setAudioTrack done");

  return {
    success: true,
    trackName: target.displayName || "Japanese",
    confident: target.isOriginal === true,
  };
}
