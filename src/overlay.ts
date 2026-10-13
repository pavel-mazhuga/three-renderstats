import type { Object3D, WebGLRenderer } from 'three';
import { collect, type RendererStatsSnapshot } from './collect';
import { injectDefaultStyles } from './styles';

export type OverlayPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type RendererStatsOptions = {
    /** Parent to append the overlay to. Defaults to `document.body`. */
    container?: HTMLElement;
    /** Corner to pin the overlay. Defaults to `'bottom-left'`. */
    position?: OverlayPosition;
    /** Extra class names on the overlay root (default class `three-renderstats` is kept). */
    className?: string;
};

function formatHeapMb(): string {
    const perf = performance as Performance & { memory?: { usedJSHeapSize: number } };

    if (perf.memory?.usedJSHeapSize != null) {
        return `${(perf.memory.usedJSHeapSize / 1048576).toFixed(1)} MB`;
    }

    return '—';
}

/**
 * DOM overlay. Main-thread only (`document` is required).
 *
 * In an OffscreenCanvas worker, call {@link collect} and send the snapshot
 * to the main thread, then {@link RendererStats.updateFromSnapshot}.
 *
 * **JS heap** (`Memory:` line) uses `performance.memory`, which exists in
 * Chromium only. Other browsers show `—`.
 */
export class RendererStats {
    readonly element: HTMLDivElement;

    constructor(options: RendererStatsOptions = {}) {
        if (typeof document === 'undefined') {
            throw new Error(
                'RendererStats overlay needs a DOM. In a worker, call collect() and postMessage the snapshot to the main thread.',
            );
        }

        injectDefaultStyles();

        this.element = document.createElement('div');

        const position = options.position ?? 'bottom-left';
        const classes = ['three-renderstats', `three-renderstats--${position}`];

        if (options.container && options.container !== document.body) {
            classes.push('three-renderstats--contained');
        }

        if (options.className) {
            classes.push(options.className);
        }

        this.element.className = classes.join(' ');

        const parent = options.container ?? document.body;
        parent.appendChild(this.element);
    }

    /** Collect a snapshot from `renderer` + `scene` and refresh the overlay. */
    update(renderer: WebGLRenderer, scene: Object3D): void {
        this.updateFromSnapshot(collect(renderer, scene));
    }

    /** Refresh the overlay from an already-collected (e.g. worker) snapshot. */
    updateFromSnapshot(snapshot: RendererStatsSnapshot): void {
        const { uniqueMaterials, materialSlots } = snapshot;
        const materialsLine =
            uniqueMaterials === materialSlots
                ? `Materials (shaders): ${uniqueMaterials}`
                : `Materials (shaders): ${uniqueMaterials} unique · ${materialSlots} slots`;

        this.element.textContent = [
            `Draw calls: ${snapshot.calls}`,
            `Triangles: ${snapshot.triangles}`,
            `Points: ${snapshot.points}`,
            `Lines: ${snapshot.lines}`,
            materialsLine,
            `Programs: ${snapshot.programs}`,
            `Memory: ${formatHeapMb()}`,
            `Geometries: ${snapshot.geometries}`,
            `Textures: ${snapshot.textures}`,
            `Render targets: ${snapshot.renderTargets}`,
            `Lights: ${snapshot.lights}`,
        ].join('\n');
    }

    dispose(): void {
        this.element.remove();
    }
}
