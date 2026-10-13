import type { Light, Material, Object3D, WebGLRenderer, WebGLRenderTarget } from 'three';

/**
 * Plain-object snapshot of one frame. Structured-cloneable — safe to
 * `postMessage` from an OffscreenCanvas worker to the main thread.
 */
export type RendererStatsSnapshot = {
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

function countSceneStats(root: Object3D): {
    uniqueMaterials: number;
    materialSlots: number;
    lights: number;
} {
    const materials = new Set<Material>();
    let materialSlots = 0;
    let lights = 0;

    root.traverse((object) => {
        if ((object as Partial<Light>).isLight) {
            lights += 1;
        }

        const m = (object as { material?: Material | Material[] }).material;

        if (m == null) {
            return;
        }

        const list = Array.isArray(m) ? m : [m];

        for (const mat of list) {
            materialSlots += 1;
            materials.add(mat);
        }
    });

    return { uniqueMaterials: materials.size, materialSlots, lights };
}

const renderTargetsPerRenderer = new WeakMap<WebGLRenderer, Set<WebGLRenderTarget>>();

function trackRenderTargets(renderer: WebGLRenderer): Set<WebGLRenderTarget> {
    let targets = renderTargetsPerRenderer.get(renderer);

    if (targets) {
        return targets;
    }

    targets = new Set();
    renderTargetsPerRenderer.set(renderer, targets);

    const originalSetRenderTarget = renderer.setRenderTarget.bind(renderer);

    renderer.setRenderTarget = ((
        target: WebGLRenderTarget | null,
        activeCubeFace?: number,
        activeMipmapLevel?: number,
    ) => {
        if (target) {
            targets?.add(target);
        }

        originalSetRenderTarget(target, activeCubeFace, activeMipmapLevel);
    }) as typeof renderer.setRenderTarget;

    return targets;
}

/**
 * Call once after creating the renderer.
 *
 * Sets `renderer.info.autoReset = false` so counters accumulate for the
 * whole frame, and **patches `renderer.setRenderTarget`** so distinct
 * render targets used during a frame can be counted. Safe to call more
 * than once on the same renderer (the patch is applied only once).
 */
export function setup(renderer: WebGLRenderer): void {
    renderer.info.autoReset = false;
    trackRenderTargets(renderer);
}

/**
 * Call at the start of every frame, before any `renderer.render()` /
 * `setRenderTarget()` work. Resets `renderer.info` and the per-frame
 * render-target set.
 */
export function beginFrame(renderer: WebGLRenderer): void {
    renderer.info.reset();
    renderTargetsPerRenderer.get(renderer)?.clear();
}

/**
 * Read counters after rendering the frame. Does not touch the DOM —
 * usable inside a Web Worker.
 */
export function collect(renderer: WebGLRenderer, scene: Object3D): RendererStatsSnapshot {
    const { render, memory, programs } = renderer.info;
    const { uniqueMaterials, materialSlots, lights } = countSceneStats(scene);

    return {
        calls: render.calls,
        triangles: render.triangles,
        points: render.points,
        lines: render.lines,
        uniqueMaterials,
        materialSlots,
        geometries: memory.geometries,
        textures: memory.textures,
        programs: programs?.length ?? 0,
        renderTargets: renderTargetsPerRenderer.get(renderer)?.size ?? 0,
        lights,
    };
}
