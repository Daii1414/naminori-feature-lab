\# 007 - Anki Comprehension Bar



\## 1. Feature Description

Implements a Migaku-style top statistics bar that analyzes Japanese text on any webpage in real-time, cross-references it with your personal deck in \*\*Anki\*\* via the \*\*Anki-Connect\*\* local plugin, and calculates your text comprehension percentage (Comprehension %).



\## 2. Motivation

Allows language learners to gauge text difficulty on external websites (social media, news, blogs) without relying on paid cloud services, relying strictly on their own personal vocabulary database from Anki.



\## 3. Architecture \& Files

\- `manifest.json`: Manifest V3 configuration with permissions for the local Anki server (`http://localhost:8765`) and all pages.

\- `background.js`: Service worker handling communication with Anki-Connect to fetch all deck names (`deckNames`) and cards in chunks of 500 (`notesInfo`), caching the vocabulary locally using `chrome.storage.local`.

\- `content.js`: Injects the top bar, dynamically loads the deck selector dropdown, shifts the page `body` down (preventing content overlap), and scans page text using a high-performance `TreeWalker` and native `Intl.Segmenter`.

\- `styles.css`: Dark-themed, isolated top bar styling with a maximum `z-index`.



\## 4. How to Run \& Test

1\. Install the \*\*Anki-Connect\*\* plugin into your desktop Anki application (plugin code: `2055492159`).

2\. Launch \*\*Anki\*\*.

3\. Open `chrome://extensions/` and enable \*\*Developer mode\*\*.

4\. Click \*\*Load unpacked\*\* and select the `features/007-anki-comprehension-bar` directory.

5\. Open any Japanese webpage, select your Anki deck from the dropdown menu on the top bar, and click \*\*Sync\*\*.



\## 5. Manual Testing Checklist

\- \[ ] The top bar appears correctly at the very top, and the webpage shifts down by exactly 36px without breaking layout.

\- \[ ] The dropdown (`<select>`) populates with your actual Anki decks.

\- \[ ] Selecting a deck and clicking "Sync" turns the status indicator green and displays the correct total word count.

\- \[ ] Scrolling the page triggers text re-analysis, updating the comprehension percentage dynamically.



\## 6. What Must Be Preserved During Integration

\- Using the native `Intl.Segmenter('ja', { granularity: 'word' })` — executes instantly without heavy external WASM/JS libraries.

\- Routing Anki-Connect requests through the background Service Worker to bypass browser extension CORS restrictions.

\- Calculating unique words on the page to provide an accurate comprehension percentage.



\## 7. What Can Be Rewritten / Adapted

\- The top bar UI styling can be customized to match the main commercial application's design system.

\- Deck selection logic can be moved to an Options Page if preferred.



\## 8. Known Limitations \& Edge Cases

\- Requires Anki to be running with the Anki-Connect plugin active.

\- On pages with heavy dynamic content (infinite scroll), text analysis runs with a throttling delay via `requestIdleCallback` to protect the CPU from lag.



\## 9. Dependencies

\- Pure Vanilla JS, native browser APIs, Anki-Connect (local service).



\## 10. Manifest V3 Permissions

\- `storage`: To save the selected deck and cached vocabulary locally.

\- `host\_permissions`: `http://localhost:8765/\*`, `<all\_urls>`.



\## 11. Security \& Privacy

\- All data is processed locally on the user's machine. Network requests are sent exclusively to `localhost:8765`.



\## 12. Performance

\- Uses `TreeWalker` to avoid scanning redundant DOM nodes, and `requestIdleCallback` to perform tokenization during browser idle time.



\## 13. Internationalization (i18n)

\- The user interface is written in English.



\## 14. Future Improvements

\- Add a modal popup when clicking the comprehension percentage to view a list of unknown words found on the current page.



\## 15. Implementation Status

\- Fully working reference implementation ready for integration.

