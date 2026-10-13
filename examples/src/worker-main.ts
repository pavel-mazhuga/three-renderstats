import { RendererStats } from 'three-renderstats';
import type { RendererStatsSnapshot } from 'three-renderstats';

const canvas = document.querySelector('canvas');

if (!canvas) {
    throw new Error('canvas missing');
}

const stats = new RendererStats({ position: 'bottom-left' });
const worker = new Worker(new URL('./world.worker.ts', import.meta.url), { type: 'module' });

const offscreen = canvas.transferControlToOffscreen();

function sendSize() {
    worker.postMessage({
        type: 'resize',
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.min(window.devicePixelRatio, 2),
    });
}

worker.addEventListener('message', (event: MessageEvent<RendererStatsSnapshot>) => {
    stats.updateFromSnapshot(event.data);
});

window.addEventListener('resize', sendSize);

worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
sendSize();
