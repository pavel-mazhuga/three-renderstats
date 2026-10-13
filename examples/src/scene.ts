import * as THREE from 'three';

export function createDemoScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(2.4, 1.6, 2.8);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 3);
    scene.add(key);

    const fill = new THREE.PointLight(0x6688ff, 8, 12);
    fill.position.set(-3, 1, 2);
    scene.add(fill);

    const knot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.7, 0.24, 128, 24),
        new THREE.MeshStandardMaterial({ color: 0x88aaff, roughness: 0.35, metalness: 0.4 }),
    );
    scene.add(knot);

    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshStandardMaterial({ color: 0x222228, roughness: 0.9, metalness: 0 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.1;
    scene.add(floor);

    const rt = new THREE.WebGLRenderTarget(64, 64);
    const preview = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 0.6),
        new THREE.MeshBasicMaterial({ map: rt.texture }),
    );
    preview.position.set(-1.5, 0.6, 0);
    scene.add(preview);

    return { scene, camera, knot, rt, preview };
}

export function resizeRenderer(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number,
    dpr: number,
) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
}

export function drawFrame(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    knot: THREE.Mesh,
    rt: THREE.WebGLRenderTarget,
    time: number,
) {
    knot.rotation.x = time * 0.35;
    knot.rotation.y = time * 0.55;

    renderer.setRenderTarget(rt);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
}
