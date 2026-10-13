import { beginFrame, collect, setup } from 'three-renderstats';
import { WebGLRenderer } from 'three';
import { createDemoScene, drawFrame, resizeRenderer } from './scene';

type InitMessage = { type: 'init'; canvas: OffscreenCanvas };
type ResizeMessage = { type: 'resize'; width: number; height: number; dpr: number };

let renderer: WebGLRenderer | null = null;
let demo: ReturnType<typeof createDemoScene> | null = null;

self.onmessage = (event: MessageEvent<InitMessage | ResizeMessage>) => {
    const data = event.data;

    if (data.type === 'init') {
        renderer = new WebGLRenderer({ canvas: data.canvas, antialias: true });
        setup(renderer);
        demo = createDemoScene();

        renderer.setAnimationLoop((time) => {
            if (!renderer || !demo) {
                return;
            }

            beginFrame(renderer);
            drawFrame(renderer, demo.scene, demo.camera, demo.knot, demo.rt, time * 0.001);
            self.postMessage(collect(renderer, demo.scene));
        });

        return;
    }

    if (data.type === 'resize' && renderer && demo) {
        resizeRenderer(renderer, demo.camera, data.width, data.height, data.dpr);
    }
};
