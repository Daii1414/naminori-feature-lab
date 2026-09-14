# 005 — Watch Time Statistics Dashboard

A standalone reference implementation that accurately tracks active Japanese immersion watch time on YouTube, filters out ads, pauses, and background tabs, and renders a GitHub-style stats dashboard complete with summary metrics, a 52-week activity heatmap, and a recently watched video history log with JSON export capabilities.

## Status
Ready for integration. Tested on live YouTube watch pages and standalone extension popup/options views.

---

## Quick Q&A for Developer & AI Agent

- **What is this?** A dual-component feature consisting of an active video watch-time tracker (`tracker.js`) and a dedicated HTML dashboard (`stats.html`/`stats.js`) that persists immersion metrics using `chrome.storage.local`.
- **What files matter?** 
  - `manifest.json`: Registers the extension popup/options UI and content script.
  - `stats.html`: Dashboard markup.
  - `stats.css`: Dark/light theme styling, metric cards, flex-based heatmap grid, and history items.
  - `stats.js`: Aggregates storage data, computes weekly totals, builds the 364-day flex heatmap grid, and handles JSON exports.
  - `tracker.js`: Monitors HTML5 `<video>` state, validates active visibility, and debounces writes to storage.
- **What must be preserved?** The active playback time validation (`dt > 0 && dt < 2` to ignore manual scrubbing), visibility state checks (`document.visibilityState === 'visible'`), and the flex-based 52-column week grouping for the heatmap.
- **What can be changed?** Dashboard UI frameworks (React/Vue/Lit), storage backends (IndexedDB), and data export formats (CSV/XML).

---

## 1. Feature Name
`006-watch-time-statistics` (Naminori Immersion Watch Time Tracker & Dashboard).

## 2. What it does
- **Active Playback Monitoring:** Hooks into YouTube's native HTML5 `<video>` element on `/watch` pages to track exact watch duration.
- **Noise & Ad Filtering:** Automatically pauses counting when videos are paused, ended, when commercial ads are playing, or when the browser tab is hidden/backgrounded (`visibilityState !== 'visible'`).
- **Scrubbing Protection:** Validates time jumps (`dt < 2` seconds per tick) to ignore manual timeline fast-forwarding or skipping.
- **Persistent Local Database:** Stores watch records (video ID, title, channel name, duration, date, JLPT level) in `chrome.storage.local`.
- **Metrics Aggregation:** Computes total lifetime watch time, total videos watched, and watch time accumulated over the last 7 days.
- **GitHub-Style Heatmap:** Organizes 364 days of history into 52 weekly flex-columns (Mon–Sun rows) with dynamic color intensity levels based on daily watch duration.
- **History Management & Export:** Renders recently watched videos with thumbnails, JLPT badges, and timestamps, plus an instant JSON export utility.

## 3. How the user interacts with it
1. The user watches Japanese videos on YouTube normally. The tracker works silently in the background.
2. At any time, the user clicks the extension icon in the toolbar (or opens options) to view their `stats.html` dashboard.
3. They can review their daily activity heatmap, check weekly watch time, inspect recent videos, or export their immersion log as a JSON file.

## 4. How to run it
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select `features/006-watch-time-statistics`.
5. Open a YouTube video, watch it for at least 10 seconds, then click the extension's action icon in the toolbar to open the stats dashboard.

## 5. Manual Test Checklist
- [ ] Extension loads without errors in `chrome://extensions/`.
- [ ] **Watch Time Accumulation:** Watching an active video for 10+ seconds increments total time and records an entry in storage.
- [ ] **Ad & Pause Immunity:** Pausing the video or watching an ad does not increment watch time.
- [ ] **Background Tab Pause:** Switching to another browser tab immediately pauses watch-time accumulation.
- [ ] **Dashboard Rendering:** Clicking the extension icon opens `stats.html`, displaying correct total watch time, video count, and weekly stats.
- [ ] **Heatmap Generation:** The 52-week activity grid renders correctly without horizontal overflow or wrapping glitches.
- [ ] **Recently Watched List:** Displays video thumbnails, titles, channel names, and durations accurately.
- [ ] **JSON Export:** Clicking "Экспорт" successfully triggers a file download containing all recorded watch data.

## 6. Expected Correct Behavior
Accurately records pure study time, filtering out idle states, ads, and background noise, and presents it in a polished GitHub-style analytics dashboard.

## 7. Dependencies Used
**None (0).** Pure Vanilla JavaScript and CSS.

## 8. Chrome Permissions Used
- `storage`: Required to read and write watch history arrays in `chrome.storage.local`.
- `host_permissions`: `*://*.youtube.com/*` (required to run the video watch-time content script on YouTube watch pages).

## 9. Key Files & Architecture
- `manifest.json`: Configures `action.default_popup` and `content_scripts`.
- `stats.html`: Dashboard UI layout.
- `stats.css`: Modern dark-theme styling, metric cards, flex heatmap layout, and history list styles.
- `stats.js`: Storage data parser, weekly metrics calculator, flex heatmap generator, and JSON exporter.
- `tracker.js`: Video element polling/event-listener tracking active watch seconds and committing batched updates.

## 10. Critical Parts to Preserve During Integration
1. **Active Playback Validation (`tracker.js`):**
   - Must check `!video.paused && !video.ended && document.visibilityState === 'visible'`.
   - Must check `dt > 0 && dt < 2` to prevent artificial inflation from timeline scrubbing.
2. **Flex-Based Week Grouping (`stats.js`):**
   - When rendering the activity heatmap, group 364 days into arrays of 7 (weeks) and render them inside vertical flex columns (`flex-direction: column`). Do not rely on pure CSS grid auto-flow columns without explicit row constraints, as they can break on varying screen widths.
3. **Batched Storage Commits:**
   - Accumulate seconds locally in the content script and write to `chrome.storage.local` in batches (e.g. every 10 seconds) to avoid disk I/O bottlenecks.

## 11. Parts That Can Be Freely Changed
- **Dashboard Framework:** The UI can be rewritten in React, Vue, or Svelte during main extension integration.
- **Storage Backend:** Can migrate from `chrome.storage.local` to `IndexedDB` if the immersion log grows extremely large over years of use.
- **Export Formats:** Add support for CSV, Anki TSV, or cloud synchronization.

## 12. Known Limitations
- Does not track watch time if the user watches YouTube embedded on third-party websites (only active on `*.youtube.com/watch*`).

## 13. Edge Cases Handled
- **Timeline Scrubbing:** Ignored via delta validation (`dt < 2`).
- **Tab Switching / Minimizing:** Paused instantly via `visibilityState` checks.
- **Commercial Ads:** Ignored (ad detection or automatic pause during non-content streams).
- **Heatmap Layout Breakage:** Fixed via week-column flex container grouping.

## 14. Edge Cases Not Handled
- Picture-in-Picture (PiP) mode visibility shifts in certain browser window states.

## 15. Expected User Result
Total transparency and gamified motivation over the user's Japanese language immersion journey, with clean analytics and portable data ownership.
