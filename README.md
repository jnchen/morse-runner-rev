# Morse Runner Web

A modern, standalone, cross-platform CW contest trainer inspired by MorseRunner.
Desktop and mobile browsers are both supported. The app can be installed as a PWA and remains fully usable offline. All training and settings data stay local.

## Status

This implementation is under active development and currently covers:

- Block-driven CW audio simulation (11025 Hz / 512-sample blocks)
- Pile-up, Single Calls, WPX-style and HST-style modes
- QRN / QRM / QSB / flutter / lids simulation
- DX operator behavior state machine
- Smart Enter sending, original-style keyboard shortcuts, and a mobile action bar
- QSO logging, duplicate/NIL/exchange checks, WPX prefix and HST scoring
- Original `MASTER.DTA` call-list upload and IndexedDB persistence
- N1MM-style call-history upload for Community Edition contests
- Local training-result history and QSO restore
- ADIF and Cabrillo 3.0 exports
- English, Chinese, and Japanese UI
- Installable offline-capable PWA

## References and acknowledgements

This project is an independent TypeScript implementation, but its behavior and contest coverage were developed by studying the public MorseRunner family of programs. In particular:

- [MorseRunner by Alex Shovkoplyas, VE3NEA](https://github.com/VE3NEA/MorseRunner) — the original CW contest simulator, including its core pileup/HST behavior, `MASTER.DTA` call-list format, operator flow, and keyboard model.
- [Morse Runner Community Edition by W7SST and contributors](https://github.com/w7sst/MorseRunner) — Community Edition contest support, N1MM-style call-history behavior, and documentation for CWT, Field Day, NAQP, CQ WW, ARRL DX, SST, JARL ALL JA/ACAG, and IARU HF.
- [BH1SCW's MorseRunner branch](https://github.com/BH1SCW/MorseRunner) — Unicode and export-related enhancements referenced by the Community Edition history.
- [F6FVY's MorseRunner branch](https://github.com/f6fvy/MorseRunner) — caller-flow and RIT/callsign-lookup improvements referenced by the Community Edition history.
- [N2IC's MorseRunner branch](https://github.com/N2IC/MorseRunner) — CQ WW support and integration-related fixes referenced by the Community Edition history.
- [JR8PPG's MorseRunnerJA branch](https://github.com/JR8PPG/MorseRunner) — JARL ALL JA and ACAG contest behavior.
- [zmetzing's Linux port](https://github.com/zmetzing/MorseRunner) — evidence that the original 1.68 simulation model could be ported beyond Delphi/Windows.

Thanks to VE3NEA for creating MorseRunner and to all Morse Runner maintainers,
contest developers, testers, and CW operators who documented its behavior over
the years. Their released programs and public notes were used as behavioral
references; this repository does not redistribute their source code or data
files.

## Online version

The latest `master` build is deployed automatically to GitHub Pages:

<https://jnchen.github.io/morse-runner-rev/>

## Local-first policy

The application does not require an account, backend, or network access. Settings and imported data remain in the browser.

Optional online features live in separate repositories:

```text
morse-runner-web-plugin
morse-runner-server
```

This repository has no runtime dependency on either project.

## Legal

This repository contains an independent TypeScript implementation and does not
include or derive from MPL-2.0 source files from the original MorseRunner
project. It is distributed under the MIT License. See `LICENSE` and `NOTICE`.

## Development

```bash
npm install
npm run dev
```

## Install as an app

The production build is a Progressive Web App. Serve it over HTTPS or localhost, then use your browser's **Install** action (or **Add to Home Screen** on iOS). After the first visit, the training interface and local data remain available offline.

## Build

```bash
npm run build
npm run preview
```

## Verify a change

```bash
npm run check
```

This runs lint, tests, and a production build.

## Community Edition contest data

The app supports Community Edition contest definitions and local call-history
uploads (for example `CWOPS.LIST`, `CQWWCW.txt`, `FDGOTA.txt`, and `SSCW.txt`).
Uploaded history files and local training results remain in the browser's
IndexedDB. They are never bundled with the application or sent to an online
service. `MASTER.DTA` remains the fallback call pool for contests without a
dedicated history file.
