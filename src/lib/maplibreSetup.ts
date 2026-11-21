import { setWorkerUrl } from 'maplibre-gl';
// Vite pre-bundles maplibre into node_modules/.vite, which breaks its relative worker lookup
// ("Worker failed to load"). Point it at a Vite-built copy of the worker instead.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setWorkerUrl(workerUrl);
