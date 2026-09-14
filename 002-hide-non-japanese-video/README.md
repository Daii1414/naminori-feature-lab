\# Feature 001: Hide Non-Japanese Videos



\## 1. What it does

Automatically hides YouTube videos on the Home page, Search results, and Sidebar ("Up Next") if their titles are not considered Japanese. 



\## 2. How the user interacts with it

This is a passive feature. The user simply browses YouTube, and English/other language videos disappear from the feed seamlessly.



\## 3. How to run it (For the Creator/Tester)

1\. Open Chrome and go to `chrome://extensions/`.

2\. Turn on "Developer mode" in the top right.

3\. Click "Load unpacked".

4\. Select the `001-hide-non-japanese-video` folder.

5\. Open YouTube. Non-Japanese videos should instantly disappear.



\## 4. Manual Test Checklist

\- \[ ] Extension loads without errors in `chrome://extensions/`.

\- \[ ] English videos disappear from the main YouTube Home page.

\- \[ ] Japanese videos remain visible.

\- \[ ] Scrolling down (infinite load) continues to hide new English videos.

\- \[ ] Searching for English terms yields no/hidden results.

\- \[ ] Clicking a Japanese video shows English suggestions in the sidebar hidden.



\## 5. Integration Guide (For the Main Developer)



\### Key Files

\- `src/content.js` (Filtering logic)

\- `src/content.css` (Hiding mechanism)



\### Permissions / Dependencies

\- \*\*Permissions needed:\*\* Only host permissions for `\*://\*.youtube.com/\*`.

\- \*\*Dependencies:\*\* None. Vanilla JS.



\### What MUST be preserved during integration

1\. \*\*The `isJapaneseTitle()` logic:\*\* This is reverse-engineered from the original extension. The specific regex symbols array and the strict fallback (`hasHiragana \&\& hasKatakana \&\& hasKanji`) are crucial for preventing false positives on videos that use Japanese kaomoji but aren't actually in Japanese.

2\. \*\*The CSS approach (`.nihongotube-hidden`):\*\* Do NOT use `display: none`. Use the provided CSS class. YouTube's grid layout (Polymer) breaks and creates massive blank gaps if `display: none` is used.



\### What can be freely changed

\- \*\*The DOM Observer:\*\* The `MutationObserver` provided here is basic. You can (and should) integrate `isJapaneseTitle()` into the main project's existing DOM watcher/state management system instead of running a second observer.

\- \*\*Selectors:\*\* `VIDEO\_SELECTORS` can be adapted to whatever component variables the main project already uses.



\## 6. Known Limitations \& Edge Cases

\- \*\*Edge case handled:\*\* Videos with Japanese Kaomoji but English titles (e.g. "My Vlog ◕○◯") are correctly identified as non-Japanese and hidden.

\- \*\*Edge case NOT handled:\*\* Videos that are entirely in English audio but have a fully translated Japanese title will NOT be hidden (because this relies on title text, not audio analysis).

