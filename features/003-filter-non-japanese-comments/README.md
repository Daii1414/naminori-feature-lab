\# 004 — Filter Non-Japanese Comments



A standalone reference implementation that filters out non-Japanese YouTube comment threads on the Watch page and injects an inline "Reveal Comments" toggle button into YouTube's comments header.



\## Status

Ready for integration. Tested on live YouTube Watch pages.



\---



\## Quick Q\&A for Developer \& AI Agent



\- \*\*What is this?\*\* A content script that parses YouTube comment threads, hides those lacking Japanese Kana scripts, and provides a toggle button to reveal hidden comments.

\- \*\*What files matter?\*\* `content.js` (DOM traversal, text heuristics, button injection) and `content.css` (hiding rules \& button styles).

\- \*\*What must be preserved?\*\* The `isJapaneseText` RegEx heuristic, the `ntCommentText` title cache for SPA stability, and the body class toggle pattern for revealing comments.

\- \*\*What can be changed?\*\* Styling of the Reveal button, hook placement, and integration with the extension's centralized state store / storage settings.



\---



\## 1. Feature Name

`004-filter-non-japanese-comments` (Naminori Comment Immersion Filter).



\## 2. What it does

\- Scans rendered comment threads (`ytd-comment-thread-renderer`) on `/watch` pages.

\- Inspects comment text in `#content-text`.

\- Evaluates text using Japanese Unicode Kana scripts (`\\p{Script=Hiragana}` and `\\p{Script=Katakana}`) with kaomoji/noise filtering.

\- Immediately hides non-Japanese comment threads using CSS (`display: none !important`).

\- Injects a native-styled \*\*"Reveal Comments (N hidden)"\*\* button next to YouTube's comment count header.

\- Toggling the button reveals all comments simultaneously while setting them to 65% opacity so users can identify which comments were filtered.

\- Seamlessly handles SPA route changes and resets state when switching to another video.



\## 3. How the user interacts with it

1\. The user scrolls down to the comments section on any YouTube video.

2\. Only Japanese comments are displayed by default.

3\. If foreign comments were filtered, a button appears in the header: \*\*"Reveal Comments (X)"\*\*.

4\. Clicking the button reveals all hidden comments with dimmed opacity. Clicking it again restores the filter.



\## 4. How to run it

1\. Open Chrome and go to `chrome://extensions/`.

2\. Enable \*\*Developer mode\*\* (top-right).

3\. Click \*\*Load unpacked\*\*.

4\. Select `features/004-filter-non-japanese-comments`.

5\. Open any popular YouTube video with an international audience (e.g. anime clips or Japanese music videos).



\## 5. Manual Test Checklist

\- \[ ] Extension loads without errors in `chrome://extensions/`.

\- \[ ] On a video with mixed comments (Japanese + English/Spanish/Russian), non-Japanese comments are completely hidden.

\- \[ ] Japanese comments remain visible with 100% normal opacity.

\- \[ ] The \*\*"Reveal Comments (X)"\*\* button appears next to the comment count header showing the number of hidden comments.

\- \[ ] Clicking the Reveal button smoothly displays the hidden comments at dimmed opacity.

\- \[ ] Clicking \*\*"Hide Non-Japanese"\*\* re-hides foreign comments.

\- \[ ] Scrolling down to load more comments (infinite scroll) correctly updates the filter and counter.

\- \[ ] Navigating to another video (SPA transition) resets the button and count.



\## 6. Expected Correct Behavior

Foreign-language comments are excluded from view. The user only reads authentic Japanese discourse. When requested, hidden comments can be inspected with one click.



\## 7. Dependencies Used

\*\*None (0).\*\* Pure Vanilla JavaScript and CSS.



\## 8. Chrome Permissions Used

\- `host\_permissions`: `\*://\*.youtube.com/\*` (needed to run content script on YouTube video pages).



\## 9. Key Files

\- `manifest.json`: Injects `content.js` and `content.css`.

\- `content.js`: Comment parsing, language evaluation, and button lifecycle management.

\- `content.css`: Comment hiding, dimmed reveal state, and YouTube-native button CSS.



\## 10. Critical Parts to Preserve During Integration

1\. \*\*The `isJapaneseText()` RegEx:\*\*

&#x20;  - Must check for Hiragana and Katakana (`\[\\p{Script=Hiragana}\\p{Script=Katakana}]`).

&#x20;  - If special symbols / kaomoji are present, require all three scripts (`Hiragana + Katakana + Kanji`) to block ASCII/symbol noise.

2\. \*\*Body Class Toggle for Reveal (`body.naminori-reveal-comments`):\*\*

&#x20;  - Toggling a class on `document.body` instead of modifying individual element classes enables instant reveal/hide of 500+ comments with zero lag.

3\. \*\*SPA Video Change Reset (`lastVideoId`):\*\*

&#x20;  - Must check `URL.searchParams.get("v")` to clean up old counts when transitioning between watch pages.



\## 11. Parts That Can Be Freely Changed

\- \*\*Button Placement \& UI:\*\* You can migrate the Reveal button to your project's React / Lit component framework or change icon assets.

\- \*\*Global Settings:\*\* Can be controlled via `De.filterComments.getValue()` or similar store setting.

\- \*\*Targeting Replies:\*\* Currently targets top-level threads (`ytd-comment-thread-renderer`). Can be expanded to individual replies (`ytd-comment-view-model`) if desired.



\## 12. Known Limitations

\- \*\*English comments with Japanese loanwords:\*\* Short English comments containing Katakana (e.g., "This is so カワイイ") will pass the kana check.

\- \*\*Single-Kanji slang:\*\* Slang consisting solely of a single Kanji without kana (e.g. `草` for "lol") will be filtered out because Kanji is not exclusive to Japanese.



\## 13. Edge Cases Handled

\- Kaomoji / emojis in comments (e.g. `great video (◕‿◕)`).

\- Infinite scroll of comment threads.

\- Video-to-video SPA navigation without page reload.

\- Light and Dark YouTube theme adaptation.



\## 14. Edge Cases Not Handled

\- Comments written in romaji (Latin alphabet transliteration of Japanese).



\## 15. Expected User Result

A clean comment section full of natural, native Japanese discussion, providing rich reading immersion without distraction.

