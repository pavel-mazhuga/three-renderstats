import { beginFrame, RendererStats, setup } from 'three-renderstats';
import { WebGLRenderer } from 'three';
import { createDemoScene, drawFrame, resizeRenderer } from './scene';

const canvas = document.querySelector('canvas');

if (!canvas) {
    throw new Error('canvas missing');
}

const renderer = new WebGLRenderer({ canvas, antialias: true });
setup(renderer);

const { scene, camera, knot, rt } = createDemoScene();
const stats = new RendererStats({ position: 'bottom-left' });

function fit() {
    resizeRenderer(renderer, camera, window.innerWidth, window.innerHeight, Math.min(window.devicePixelRatio, 2));
}

window.addEventListener('resize', fit);
fit();

renderer.setAnimationLoop((time) => {
    beginFrame(renderer);
    drawFrame(renderer, scene, camera, knot, rt, time * 0.001);
    stats.update(renderer, scene);
});
