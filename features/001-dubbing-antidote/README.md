# 001 — Dubbing Antidote

A standalone Chrome Extension feature that detects YouTube's automatically dubbed audio and switches back to the Japanese original audio track when a Japanese original track is available.

## Status

Working prototype, tested on YouTube.

## What it does

- Detects available YouTube audio tracks.
- Identifies the Japanese original track from YouTube's track metadata.
- Detects auto-dubbed tracks without hardcoding English as the only dub language.
- Switches to the Japanese original track automatically.
- Handles YouTube's single-page navigation.
- Retries while the YouTube player/audio tracks are loading.

## Manual testing

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder: `features/001-dubbing-antidote`.
5. Open a YouTube video that has multiple audio tracks / automatic dubbing.
6. Check the extension's behavior and the service worker/content-script console logs if needed.
7. Change to another YouTube video and verify that the feature runs again.

## Notes for integration

This is a standalone reference implementation. It is intentionally independent of the closed-source main extension and should be adapted to the main project's architecture during integration.
