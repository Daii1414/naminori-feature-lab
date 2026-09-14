# 005 — JLPT Difficulty Analyzer & Badge

A standalone reference implementation that analyzes YouTube Japanese subtitles in the background, calculates the video's JLPT difficulty level (N5 to N1), and injects a color-coded difficulty badge directly onto video cards.

## Status
Ready for integration. Tested on live YouTube feed and watch sidebar.

---

## Quick Q&A for Developer & AI Agent

- **What is this?** A zero-dependency client-side analyzer that fetches video transcripts via YouTube's internal player API, segments words using browser-native `Intl.Segmenter`, matches words against a bundled JLPT N5–N1 vocabulary frequency dictionary, and displays color-coded level badges (`N5` through `N1`).
- **What files matter?** 
  - `dict.js`: The JLPT vocabulary frequency map (N5–N1).
  - `content.js`: The transcript downloader, tokenizer, difficulty scoring algorithm, and badge DOM injector.
  - `content.css`: Badge styling, colors, and loading animation.
- **What must be preserved?** The weighted level scoring formula, native `Intl.Segmenter` tokenizer, the internal `/youtubei/v1/player` transcript discovery flow, and in-flight request deduplication.
- **What can be changed?** Badge UI/placement, dictionary expansion, custom user level thresholds, and caching mechanisms (e.g. storing in IndexedDB or Chrome Storage).

---

## 1. Feature Name
`005-jlpt-difficulty-badge` (Naminori Subtitle JLPT Analyzer).

## 2. What it does
- Extracts `videoId` from YouTube video cards on Home, Search, and Watch sidebar.
- Queries `/youtubei/v1/player` using a lightweight fetch request to retrieve available subtitle tracks.
- Selects the Japanese track (prioritizing manual native captions over `asr` auto-generated captions).
- Downloads and parses the subtitle XML stream (`timedtext`).
- Segments the full transcript text into word tokens using Chrome's native `Intl.Segmenter('ja', { granularity: 'word' })`.
- Compares tokens against the offline `JLPT_DICT` map to calculate recognized word distribution.
- Computes the weighted average level ($N5 \dots N1$) and appends an asterisk (`*`) if generated from auto-subtitles.
- Injects a colored badge (`.naminori-jlpt-badge`) with a tooltip displaying word counts and caption type.
- Caches analysis results in memory to prevent duplicate network calls during scrolling.

## 3. How the user interacts with it
**Passive visualization.** The user browses YouTube and immediately sees color-coded difficulty indicators on Japanese videos:
- 🟢 **N5:** Beginner
- 🍏 **N4:** Upper Beginner
- 🟡 **N3:** Intermediate
- 🟠 **N2:** Upper Intermediate / Pre-Advanced
- 🔴 **N1:** Advanced / Native

## 4. How to run it
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `features/005-jlpt-difficulty-badge`.
5. Open YouTube. Browse Japanese channels or search for Japanese topics. Badges will load seamlessly on video cards.

## 5. Manual Test Checklist
- [ ] Extension loads without errors in `chrome://extensions/`.
- [ ] Japanese videos with subtitles display a color-coded level badge (`N5`–`N1`).
- [ ] Auto-generated subtitles display an asterisk (e.g. `N3*`).
- [ ] Hovering over the badge shows a tooltip with caption type and analyzed word count.
- [ ] Videos without Japanese subtitles do not show broken badges.
- [ ] Scrolling down to load more videos dynamically analyzes new cards.
- [ ] Revisiting already analyzed cards does not trigger duplicate network requests (in-memory cache verification).

## 6. Expected Correct Behavior
Video cards receive color-coded badges indicating their linguistic difficulty. If a video has no Japanese captions, it is gracefully skipped.

## 7. Dependencies Used
**None (0).** Pure Vanilla JavaScript using web-standard `Intl.Segmenter`.

## 8. Chrome Permissions Used
- `host_permissions`: `*://*.youtube.com/*` (for content script execution and same-origin `/youtubei/v1/player` requests).

## 9. Key Files
- `manifest.json`: Injects `dict.js`, `content.js`, and `content.css`.
- `dict.js`: Offline dictionary containing ~3,000 JLPT words categorized by level.
- `content.js`: Video discovery, subtitle fetching, word scoring, and badge DOM insertion.
- `content.css`: Visual styling for badges and pulse animations.

## 10. Critical Parts to Preserve During Integration
1. **Lightweight Same-Origin Player API:**
   - Use `/youtubei/v1/player` with `clientName: "WEB"` directly from the content script. This completely avoids needing third-party API keys or heavy InnerTube libraries.
2. **Native Tokenization (`Intl.Segmenter`):**
   - Do NOT bundle heavy external morphological analyzers (like Kuromoji or MeCab) in the client bundle. `Intl.Segmenter` is natively supported in V8/Chromium and is instantaneous.
3. **In-Flight Deduplication & Memory Cache:**
   - Multiple UI elements can share the same `videoId`. Always deduplicate active promises with `inFlightRequests` Map to prevent network spam.
4. **Weighted Score Algorithm:**
   - Weighted average: $\sum (\text{count} \times \text{level}) / \text{totalRecognized}$.

## 11. Parts That Can Be Freely Changed
- **Badge Design:** Can be customized to match the main project's design system.
- **Persistent Storage:** Analysis results can be persisted to `IndexedDB` or `chrome.storage.local` across browser restarts.
- **Detailed Modal/Dropdown:** You can expand the badge into a full difficulty breakdown panel showing WPM (Words Per Minute) and lexical density graphs.

## 12. Known Limitations
- Requires videos to have Japanese subtitles (either manual or YouTube ASR auto-generated). Videos with speech but zero captions cannot be evaluated client-side.
- Chinese videos that lack Japanese subtitles will not receive badges.

## 13. Edge Cases Handled
- **Subtitles loading delay:** Shows a subtle pulsing placeholder badge until analysis completes.
- **ASR vs. Native Captions:** Differentiates automated captions with `*`.
- **Virtual DOM Recycling:** Tracks `data-nt-jlpt-video-id` on cards to re-evaluate when a card changes during SPA scroll.

## 14. Edge Cases Not Handled
- Videos where the Japanese audio does not match the subtitles (e.g. foreign movie with Japanese translation text).

## 15. Expected User Result
Immediate, visual clarity on whether a video fits the learner's current comprehensible input level before clicking.