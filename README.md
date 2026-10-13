# three-renderstats

Lightweight renderer stats overlay for [three.js](https://threejs.org/). Draw calls, triangles, materials, programs, geometries, textures, render targets, lights, and (Chromium-only) JS heap.

Plain three.js — **no React**. Works on the main thread and with **OffscreenCanvas** workers: collect a serializable snapshot in the worker, paint the overlay on the main thread.

Not published to npm. Install from GitHub:

```bash
npm install github:pavel-mazhuga/three-renderstats
# or
pnpm add github:pavel-mazhuga/three-renderstats
```

`three` is a **peer dependency** (`>= 0.160`). TypeScript users: install `@types/three` if your `three` version does not ship its own types.

## Caveats

- **`setup()` patches `renderer.setRenderTarget`.** It wraps the method so the overlay can count distinct render targets used during a frame. The patch is applied once per renderer and is not restored. Call `setup()` only on renderers you own.
- **`renderer.info.autoReset` is set to `false`.** You must call `beginFrame(renderer)` at the start of every frame, or the counters will keep growing.
- **JS heap (`Memory:`) is Chrome/Chromium only.** It reads `performance.memory.usedJSHeapSize`. Firefox and Safari show `—`.

## Usage

```ts
import * as THREE from 'three';
import { setup, beginFrame, RendererStats } from 'three-renderstats';

const renderer = new THREE.WebGLRenderer({ canvas });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);

setup(renderer);

const stats = new RendererStats({
    container: document.body, // default
    position: 'bottom-left', // default; also top-left | top-right | bottom-right
    // className: 'my-stats',
});

function frame() {
    beginFrame(renderer);
    renderer.render(scene, camera);
    stats.update(renderer, scene);
    requestAnimationFrame(frame);
}

frame();

// later:
// stats.dispose();
```

### Worker (OffscreenCanvas)

The overlay needs a DOM, so it stays on the main thread. The worker only collects a plain snapshot (`postMessage`-safe) and sends it over.

**Main thread**

```ts
import { RendererStats } from 'three-renderstats';

const canvas = document.querySelector('canvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker(new URL('./world.worker.ts', import.meta.url), { type: 'module' });

worker.postMessage({ canvas: offscreen }, [offscreen]);

const stats = new RendererStats();
worker.addEventListener('message', (event) => {
    stats.updateFromSnapshot(event.data);
});
```

**Worker**

```ts
import * as THREE from 'three';
import { setup, beginFrame, collect } from 'three-renderstats';

self.onmessage = (event) => {
    const renderer = new THREE.WebGLRenderer({ canvas: event.data.canvas });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    setup(renderer);

    const loop = () => {
        beginFrame(renderer);
        renderer.render(scene, camera);
        self.postMessage(collect(renderer, scene));
        requestAnimationFrame(loop);
    };

    loop();
};
```

The snapshot is a plain object of numbers. You can wrap it in your own message envelope if the worker already has a protocol:

```ts
self.postMessage({ type: 'stats', payload: collect(renderer, scene) });
```

## Example

```bash
git clone https://github.com/pavel-mazhuga/three-renderstats.git
cd three-renderstats
npm install
npm run build
cd examples
npm install
npm run dev
```

Opens a small three.js scene with the overlay. `examples/worker.html` does the same through an OffscreenCanvas worker.

## API

### `setup(renderer: WebGLRenderer): void`

Call once after creating the renderer. Sets `renderer.info.autoReset = false` and patches `setRenderTarget` (see [Caveats](#caveats)). Idempotent per renderer.

### `beginFrame(renderer: WebGLRenderer): void`

Call at the **start** of every frame, before any `render()` / `setRenderTarget()`. Resets `renderer.info` and the per-frame render-target set.

### `collect(renderer: WebGLRenderer, scene: Object3D): RendererStatsSnapshot`

Read counters after rendering. No DOM. Safe in a worker.

### `RendererStatsSnapshot`

```ts
type RendererStatsSnapshot = {
    calls: number;
    triangles: number;
    points: number;
    lines: number;
    uniqueMaterials: number;
    materialSlots: number;
    geometries: number;
    textures: number;
    programs: number;
    renderTargets: number;
    lights: number;
};
```

`uniqueMaterials` is the set of material instances on the scene graph. `materialSlots` is how many mesh material slots exist (a mesh with two materials counts as two slots). `renderTargets` is how many distinct targets `setRenderTarget` saw this frame — **0 unless you called `setup()`**.

### `new RendererStats(options?)`

Main-thread overlay. Appends itself to `options.container` (default `document.body`).

| Option      | Default          | Description                                                                 |
| ----------- | ---------------- | --------------------------------------------------------------------------- |
| `container` | `document.body`  | Parent element. Non-`body` containers get `position: absolute` on the panel. |
| `position`  | `'bottom-left'`  | `'top-left'` \| `'top-right'` \| `'bottom-left'` \| `'bottom-right'`        |
| `className` | —                | Extra class names. Base class `three-renderstats` is always kept.           |

Throws if constructed without `document` (e.g. inside a worker).

### `stats.update(renderer, scene): void`

Collect + paint. Main-thread convenience.

### `stats.updateFromSnapshot(snapshot): void`

Paint from an existing snapshot (worker path). Heap is still read on the main thread when this runs.

### `stats.dispose(): void`

Removes the overlay element. Does **not** unpatch `setRenderTarget`.

### `stats.element: HTMLDivElement`

The overlay root, if you need to move it yourself.

## License

MIT © Pavel Mazhuga
