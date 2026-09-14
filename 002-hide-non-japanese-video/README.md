# 002 — Hide Non-Japanese Videos

A standalone reference implementation that filters out non-Japanese YouTube videos across the Home feed, Search results, Channel pages, and Watch page sidebar, repairing YouTube's layout engine so that no blank gaps or broken shelves remain.

## Status
Ready for integration. Tested on live YouTube web (Desktop & Mobile Web components).

---

## Quick Q&A for Developer & AI Agent

- **What is this?** A client-side content script filter that evaluates video titles for Japanese scripts and hides non-matching items while ensuring surrounding elements reflow seamlessly.
- **What files matter?** `content.js` (DOM search, title heuristics, shelf collapse, SPA change detection) and `content.css` (layout reflow & hiding rules).
- **What must be preserved?** The inverted RegEx algorithm (`isJapaneseTitle`), the hierarchical container resolution logic, the CSS row-flattening (`display: contents`), and title-tracking on elements.
- **What can be changed?** The polling/MutationObserver mechanism, integration into your state store/toggle settings, and mapping selectors to your internal registry.

---

## 1. Feature Name
`002-hide-non-japanese-video` (Naminori Feed & Recommendation Filter).

## 2. What it does
- Scans video cards on the Home page, Search results, Channel video grids, and the Watch page sidebar ("Up Next").
- Analyzes titles using Unicode script expressions (`\p{Script=Hiragana}` and `\p{Script=Katakana}`).
- Strips noise tags (`fypシ`, `ミックスリスト`) and enforces a 3-script check (Hiragana + Katakana + Kanji) if kaomoji/symbols are detected to prevent false positives.
- Identifies and collapses orphaned shelf headers (e.g. empty "Shorts" or "Breaking News" sections) when all their inner items have been filtered out.
- Prevents DOM recycling issues during YouTube's SPA navigation by tracking title changes rather than using static boolean flags.
- Solves YouTube's rigid 4-card row gaps by flattening `ytd-rich-grid-row` containers via `display: contents`.
- Triggers auto-loading if consecutive filtered items leave the visible viewport underpopulated.

## 3. How the user interacts with it
**Passive.** The user browses YouTube normally. English, Russian, or other non-target language videos simply do not appear in feeds or recommendations.

## 4. How to run it
1. Open Chrome and go to `chrome://extensions/`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select `features/002-hide-non-japanese-video`.
5. Open YouTube (`https://www.youtube.com`).

## 5. Manual Test Checklist
- [ ] Extension loads without errors in `chrome://extensions/`.
- [ ] **Home Page:** English/Russian videos are hidden; remaining Japanese cards pack tightly with no missing-column holes.
- [ ] **Shelves:** If all Shorts in a shelf are non-Japanese, the entire shelf header collapses.
- [ ] **Watch Page Sidebar:** Foreign recommendations (e.g. MrBeast, foreign clips) are hidden; only Japanese videos and shorts remain visible.
- [ ] **SPA Route Changes:** Clicking a video navigates to `/watch` and immediately filters the new sidebar recommendations without requiring a page refresh (`F5`).
- [ ] **Infinite Scroll:** Scrolling down continues to filter newly loaded items.

## 6. Expected Correct Behavior
Any video card whose title does not contain valid Japanese kana is removed from document flow (`display: none !important`). Surrounding items reflow naturally to fill the space.

## 7. Dependencies Used
**None (0).** Plain Vanilla JavaScript & CSS.

## 8. Chrome Permissions Used
- `host_permissions`: `*://*.youtube.com/*` (required to run content scripts on YouTube).

## 9. Key Files
- `manifest.json`: Content script declaration.
- `content.js`: Main filtering loop, script detection, and DOM observers.
- `content.css`: Critical layout fixes for YouTube Polymer/Lit components.

## 10. Critical Parts to Preserve During Integration
1. **The `isJapaneseTitle()` RegEx Heuristic:**
   - Standard check: Must contain Hiragana or Katakana (`/[\p{Script=Hiragana}\p{Script=Katakana}]/u`).
   - Noise strip: `fypシ`, `fypシ゚`, `ミックスリスト`.
   - Kaomoji guard: If special symbols match, require **all three scripts** (`hasHiragana && hasKatakana && hasKanji`). Do NOT simplify this to pure Kanji checks, or Chinese videos will leak into the feed.
2. **Hierarchical Container Resolution (`getTargetCard`):**
   - On the Home feed, it must resolve to `ytd-rich-item-renderer` (the grid cell). Do NOT hide `yt-lockup-view-model` on Home, or an empty placeholder box will break the grid.
   - In the Watch sidebar, it must fall back to `yt-lockup-view-model` or `ytd-compact-video-renderer`.
3. **CSS Row Flattening (`content.css`):**
   - `ytd-rich-grid-row, ytd-rich-grid-row #contents { display: contents !important; }`
   - Without this, YouTube's rigid row wrappers prevent cards from moving across rows to fill blank slots.
4. **SPA Title Tracking (`card.dataset.ntTitle`):**
   - YouTube recycles DOM nodes when navigating. Do NOT use permanent `processed = true` flags. Always re-evaluate when `card.dataset.ntTitle !== titleText`.

## 11. Parts That Can Be Freely Changed
- **Observer Mechanism:** Replace the standalone `MutationObserver` with your project's centralized YouTube page/lifecycle watcher.
- **Settings Store:** Hook into your project's storage toggles (`setting_filter_videos`, `whitelisted_channels`).
- **Selector Constants:** Map `TITLE_SELECTORS` to your project's shared selector registry.

## 12. Known Limitations
- **Auto-translated titles:** If YouTube servers provide an official localized Japanese title for an English video, the title passes the kana check.
- **Kanji-only titles:** Rare titles consisting of 100% Kanji without any Kana (e.g. classical idioms) are filtered out to keep Chinese videos strictly excluded.

## 13. Edge Cases Handled
- Kaomoji / emojis in Western titles (e.g. `Vlog (◕‿◕)`).
- YouTube virtual list element recycling on SPA navigation.
- Grid reflow across multi-row boundaries.
- Empty shelves left behind by filtered carousels.

## 14. Edge Cases Not Handled
- Videos in English audio with custom Japanese translated titles.
- Hardcoded video stream burned-in subtitles.

## 15. Expected User Result
A distraction-free, 100% Japanese immersion browsing experience on YouTube with no broken UI or empty gaps.
