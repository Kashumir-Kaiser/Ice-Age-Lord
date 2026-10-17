# Local map benchmark on Intel UHD 620

Run the benchmark on the target laptop from a logged-in desktop session. Headed Chromium needs an available graphical display; if Chromium cannot attach to the display or start, the command fails with a targeted error.

Install frontend dependencies once with `cd frontend && npm ci`. Then, from the repository root, run the normal-quality matrix:

```sh
cd frontend && MAP_BENCH_HEADLESS=false npm run benchmark:maps
```

For low-quality measurements, run:

```sh
cd frontend && MAP_BENCH_HEADLESS=false MAP_BENCH_QUALITY=low npm run benchmark:maps
```

Each command builds the production frontend and measures five fixtures for 60 seconds each, three runs per fixture, after a 10-second warmup. The output is written to `frontend/map-evidence/benchmark/results.json` and printed as `MAP_BENCH_RESULT` lines. Copy the JSON after each quality run if both results need to be retained, because the next command overwrites the file.

Each result records the WebGL vendor and renderer, whether each value came from the unmasked debug extension or the masked WebGL parameters, and the browser mode. `targetDeviceVerified` is computed by the harness: it is true only when headed Chromium reports Intel and UHD Graphics 620 in the renderer and the adapter string does not identify a software renderer. There is no manual override. Headless CI remains the default; `CHROMIUM_EXECUTABLE_PATH` can still select a custom Playwright-compatible Chromium binary.
