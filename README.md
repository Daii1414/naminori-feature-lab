# JP Immersion Extension Features

Standalone implementations and prototypes of features intended for integration into the main JP Immersion Chrome extension.

Each feature is independently testable as a Chrome Extension and is developed separately from the closed-source main project.

## Features

### 001 — Dubbing Antidote

Automatically switches YouTube auto-dubbed audio back to the Japanese original audio track when available.

**Status:** Working prototype

- Chrome Extension Manifest V3
- YouTube audio track detection
- Japanese original audio detection
- Automatic switching from auto-dub to Japanese original
- YouTube SPA navigation support
- Retry logic for asynchronously loaded players

See `features/001-dubbing-antidote/README.md` for details and testing instructions.
