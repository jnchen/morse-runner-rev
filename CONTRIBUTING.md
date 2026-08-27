# Contributing to Morse Runner Web

Thanks for your interest in improving this standalone CW contest trainer.

## Ground rules

- Keep the standalone application fully usable **without** an account, backend, or network.
- Online features must be optional and live in the separate plugin/backend projects.
- Do not commit user data, `MASTER.DTA`, call-history files, logs, credentials, or binaries.
- Keep all user-facing text translated in English, Chinese, and Japanese.
- Prefer focused changes with tests for engine behavior and data import/export.

## Development setup

```bash
npm install
npm run dev
```

Run the complete local check before opening a PR:

```bash
npm run check
```

This runs lint, tests, and a production build.

## Architecture notes

- `src/engine/` contains the audio and contest simulation.
- `src/stores/` contains local settings and IndexedDB persistence.
- `src/components/` contains UI building blocks.
- `tests/` contains engine and local-storage regression tests.

## Data and compatibility

`MASTER.DTA` and call-history formats are runtime user imports. They must remain local and must not be bundled or redistributed. Please document any format compatibility assumptions in tests.

## License

By contributing, you agree that your contributions are licensed under the repository's MIT License.
