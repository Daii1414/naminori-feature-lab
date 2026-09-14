# 004 — JLPT Difficulty Analyzer & Badge (Full Statistics Engine)

A standalone reference implementation that fetches YouTube Japanese subtitles in the background via iOS client emulation, parses timedtext streams, analyzes lexical frequency using browser-native `Intl.Segmenter` and an offline JLPT N5–N1 dictionary, and injects both color-coded difficulty badges onto video cards and a comprehensive immersion statistics dashboard beneath the watch player.

## Status
Ready for integration. Tested on live YouTube feed, search results, watch sidebar, and watch page metadata rows.

---

## Quick Q&A for Developer & AI Agent

- **What is this?** A zero-dependency client-side statistical analyzer that evaluates Japanese YouTube video transcripts to compute readability, word counts, WPM (Words Per Minute), character density, vocabulary distribution ratios, and an overall JLPT level (N5 through N1).
- **What files matter?** 
  - `manifest.json`: Extension entry point declaring content scripts.
  - `dict.js`: The offline vocabulary map containing ~3,000 words categorized by JLPT level (N1–N5).
  - `analyzer.js`: The core text processing engine (tokenization, metrics calculation, level scoring).
  - `content.js`: YouTube DOM integration, iOS player API subtitle discovery, caching, and UI injection (feed badges + watch page stats box).
  - `content.css`: Visual styling for badges and the multi-color difficulty distribution bar.
- **What must be preserved?** 
  1. The iOS client emulation headers (`X-YouTube-Client-Name: 5`) for caption discovery.
  2. The RegEx-based timedtext parser (`pRegex`/`textRegex`) to bypass XML entity syntax crashes.
  3. The browser-native `Intl.Segmenter` word tokenization.
  4. The weighted scoring algorithm (`evaluateJLPT`).
  5. In-flight request deduplication (`inFlightPromises`).
- **What can be changed?** UI layouts, styling, persistent storage (e.g. saving stats to `chrome.storage.local`), and dictionary expansion.

---

## 1. Feature Name
`005-jlpt-difficulty-badge` (Naminori Subtitle JLPT Analyzer & Immersion Dashboard).

## 2. What it does
- **Video ID Extraction:** Parses unique 11-character video IDs from YouTube cards and watch URLs (`/watch?v=` or `/shorts/`).
- **Botguard-Free Subtitle Discovery:** Issues a POST request to `https://www.youtube.com/youtubei/v1/player` using official iOS client headers (`X-YouTube-Client-Name: 5`, `clientName: "IOS"`). This bypasses web botguard/poToken restrictions and reliably fetches available caption tracks.
- **Track Selection:** Prioritizes manual native Japanese captions (`languageCode === "ja"`, non-ASR) over automatic YouTube ASR captions.
- **Robust TimedText Parsing:** Downloads subtitle XML streams and extracts text segments using fault-tolerant regular expressions (`pRegex` and `textRegex`), successfully sanitizing malformed HTML entities (e.g. `&#39;`, `&amp;`).
- **Native Word Tokenization:** Splits continuous Japanese transcript text into word tokens instantly using Chrome's built-in `Intl.Segmenter('ja', { granularity: 'word' })` with zero external library overhead.
- **Lexical Scoring & JLPT Mapping:** Matches tokens against `JLPT_DICT` to compute vocabulary distribution ratios ($N1 \dots N5$), deriving an overall weighted difficulty level.
- **WPM & Density Metrics:** Calculates speech speed (Words Per Minute), total word count, total character count, and line density.
- **Two-Tier UI Rendering:**
  1. **Card Badges:** Injects a sleek, native-styled `.nt-jlpt-badge` (e.g. `JLPT N3`, `JLPT N1*`) into the video card metadata area.
  2. **Watch Page Dashboard:** Injects a comprehensive statistics box (`.nt-db-row`) above `#bottom-row` on `/watch` pages, showing WPM, words, characters, density, and a multi-color vocabulary distribution progress bar.
- **Memory Caching:** Deduplicates active network requests (`inFlightPromises`) and caches analysis results (`analysisCache`) to ensure zero performance degradation during feed scrolling.

## 3. How the user interacts with it
**Passive visualization.** 
- When browsing the feed, the user sees subtle level badges (`JLPT N3`, `JLPT N1*`) under video metadata.
- When opening a video, a detailed immersion stats bar appears below the player title, breaking down speech speed, vocabulary size, and lexical composition.

## 4. How to run it
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select `features/005-jlpt-difficulty-badge`.
5. Open YouTube and browse Japanese channels or watch a Japanese video.

## 5. Manual Test Checklist
- [ ] Extension loads without errors in `chrome://extensions/`.
- [ ] **Card Badges:** Japanese videos display a gray/translucent badge like `JLPT N3` or `JLPT N1*` right below the view count.
- [ ] **Watch Page Dashboard:** Opening a Japanese video injects the comprehensive stats box (WPM, words, density, distribution bar) right above the video description.
- [ ] **Auto-Generated Subtitles:** Automatically generated captions correctly append an asterisk (`*`) to the badge.
- [ ] **Tooltip Info:** Hovering over a card badge displays exact word counts and caption type in the tooltip.
- [ ] **No-Subtitle Graceful Skip:** Videos with zero Japanese subtitles do not throw errors or render broken UI elements.
- [ ] **Performance & Caching:** Scrolling down does not spam network requests; cached videos load badges instantly.

## 6. Expected Correct Behavior
Video cards and watch pages are enriched with accurate linguistic difficulty metrics derived directly from official video transcripts without breaking YouTube's native layout.

## 7. Dependencies Used
**None (0).** Pure Vanilla JavaScript utilizing web-standard `Intl.Segmenter`.

## 8. Chrome Permissions Used
- `host_permissions`: `*://*.youtube.com/*` (required to execute content scripts and fetch subtitle tracks via same-origin InnerTube requests).

## 9. Key Files & Architecture
- `manifest.json`: Extension manifest loading `dict.js`, `analyzer.js`, `content.js`, and `content.css`.
- `dict.js`: Offline dictionary containing ~3,000 JLPT words mapped to levels 1 through 5.
- `analyzer.js`: Pure data-processing functions (`tokenize`, `analyzeTranscript`) calculating WPM, density, and score ratios.
- `content.js`: DOM lifecycle observer, iOS InnerTube fetcher, timedtext XML downloader, and UI injector.
- `content.css`: Styling for `.nt-jlpt-badge` and the watch page `.nt-db-row` dashboard.

## 10. Critical Parts to Preserve During Integration

### ⚠️ Note on Algorithm Limitations & Future Rework
While the current weighted frequency scoring formula (`evaluateJLPT`) is fully functional and stable for a reference prototype, **the core difficulty estimation algorithm itself is intended to be overhauled or rewritten** during final integration into the main project. The main developer/AI agent should feel free to replace or heavily upgrade the scoring heuristic to incorporate grammar parsing, LLM-based calibration, or advanced corpus analysis if higher precision is required.

1. **iOS Client Emulation for Subtitle Discovery:**
   - Always query `/youtubei/v1/player` with headers `X-YouTube-Client-Name: 5` and client payload `clientName: "IOS"`. Web clients require complex botguard tokens that fail in extension context; iOS clients bypass this effortlessly.
2. **RegEx XML Subtitle Parsing (`downloadTranscript`):**
   - Do NOT use `DOMParser` for parsing subtitle XML (`timedtext`). YouTube XML contains malformed entities that throw parsing exceptions. Use the provided regular expressions (`pRegex` and `textRegex`) combined with `cleanEntities()`.
3. **Browser-Native Tokenization (`Intl.Segmenter`):**
   - Rely on `Intl.Segmenter('ja', { granularity: 'word' })`. Do not attempt to bundle heavy morphological libraries (like Kuromoji) which increase bundle size by 20MB+.
4. **Synchronous Duplication Locks (`activeWatchVideoId`):**
   - Watch page injection must use an immediate synchronous lock to prevent asynchronous race conditions where a slow network fetch triggers multiple concurrent insertions.
5. **In-Flight Promise Deduplication (`inFlightPromises`):**
   - Prevent duplicate fetches for the same `videoId` when multiple cards or components request analysis simultaneously.

## 11. Parts That Can Be Freely Changed
- **Badge UI & Colors:** You can modify CSS variables (`--nt-text-secondary`, `--nt-overlay`) or redesign the watch page dashboard to match your main project's design system.
- **Persistent Storage:** Move `analysisCache` from in-memory Map to `chrome.storage.local` or `IndexedDB` if you want cache persistence across browser sessions.
- **Integration Hooks:** Decouple `analyzer.js` into a shared utility function so it can be called by other modules (e.g. watch time statistics or flashcard generators).

## 12. Known Limitations
- Requires videos to have accessible Japanese subtitle tracks (manual or YouTube ASR). Videos with Japanese audio but zero caption tracks cannot be evaluated.
- Non-Japanese videos or pure Chinese videos lacking Japanese captions are skipped entirely.

## 13. Edge Cases Handled
- **Async network delays:** Renders a loading state (`JLPT...` pulse) until data arrives.
- **ASR vs. Manual Captions:** Appends `*` for auto-generated subtitles.
- **SPA Navigation & DOM Recycling:** Tracks `data-nt-jlpt-video-id` and clears/re-renders watch page stats when navigating between videos without a hard refresh.
- **XML Entity Escaping:** Cleans up HTML entities (`&#39;`, `&amp;`, `&quot;`) smoothly.

## 14. Edge Cases Not Handled
- Videos where the spoken Japanese audio completely diverges from the subtitle text (e.g. poorly translated foreign content).

## 15. Expected User Result
Immediate, data-driven insight into a video's linguistic difficulty before watching, allowing learners to pick content matching their exact comprehensible input level.
