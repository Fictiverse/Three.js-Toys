let scene, camera, renderer, surface, controls, particleSystem;
let particles = [], particleLifetimes = [];
let particleGeometry, particlePositions, particleColors;

const particleParams = { speed: 0.2, particleCount: 10000, lifetime: 2, spawnRate: 20000, particleSize: 0.1 };
const params = { distance: 2.5, scale: 1 };
const mods = { mode: 'Surface' };

function init() {
    // Initialisation de la scène, caméra, et rendu
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Contrôles de caméra
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 30;

    generateSurface(params.distance);

    // Interface utilisateur
    const gui = new dat.GUI();
    gui.add(params, 'distance', 0.001, 5).step(0.001).onChange(value => {
        scene.remove(surface);
        generateSurface(value);
        resetParticles();
    });
    gui.add(particleParams, 'speed', 0.001, 1).step(0.001).name('Particle Speed');
    gui.add(particleParams, 'lifetime', 0.1, 10).step(0.1).name('Particle Lifetime');
    gui.add(particleParams, 'spawnRate', 1000, 50000).step(10).name('Spawn Rate');
    gui.add(particleParams, 'particleSize', 0.01, 1).step(0.01).name('Particle Size');
    gui.add(mods, 'mode', ['Potential', 'Gradient', 'Current Flow']).onChange(resetParticles);

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function generateSurface(posDistance) {
    const geometry = new THREE.PlaneGeometry(24, 24, 256, 256);
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];
        vertices[i + 2] = potentiel(x, y, posDistance);
    }
    geometry.computeVertexNormals();

    const colors = [];
    const color = new THREE.Color();
    for (let i = 0; i < vertices.length; i += 3) {
        const z = vertices[i + 2];
        const normalizedZ = THREE.MathUtils.clamp((z + 1) / 2, 0, 1);
        color.setRGB(normalizedZ, 0, -normalizedZ);
        colors.push(color.r, color.g, color.b);
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    surface = new THREE.Mesh(geometry, material);
    surface.rotation.x = -Math.PI / 2;
    scene.add(surface);
}

function potentiel(x, y, distance) {
    const chargePos = [distance, 0];
    const chargeNeg = [-distance, 0];
    const r_pos = Math.sqrt((x - chargePos[0]) ** 2 + (y - chargePos[1]) ** 2);
    const r_neg = Math.sqrt((x - chargeNeg[0]) ** 2 + (y - chargeNeg[1]) ** 2);
    return (1 / r_pos) - (1 / r_neg);
}

function generateParticle() {
    const x = (Math.random() - 0.5) * 24;
    const y = (Math.random() - 0.5) * 24;
    const z = potentiel(x, y, params.distance) * (Math.random() - 0.5) * 4;
    particles.push({ position: [x, y, z], lifetime: particleParams.lifetime });
}

function resetParticles() {
    particles = [];
    particleGeometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array(particleParams.particleCount * 3);
    particleColors = new Float32Array(particleParams.particleCount * 4);
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(particleColors, 4));

    if (particleSystem) scene.remove(particleSystem);

    const particleMaterial = new THREE.PointsMaterial({
        size: particleParams.particleSize,
        vertexColors: true,
        transparent: true,
        alphaTest: 0.5
    });
    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
}

function updateParticles(deltaTime) {
    const particlesToSpawn = Math.floor(particleParams.spawnRate * deltaTime);
    for (let i = 0; i < particlesToSpawn; i++) generateParticle();

    particles.forEach((particle, i) => {
        const [x, y, z] = particle.position;
        if (mods.mode === 'Potential') particle.position[2] += potentiel(x, y, params.distance) * particleParams.speed;
        else if (mods.mode === 'Gradient') {
            const gradX = (potentiel(x + 0.1, y, params.distance) - potentiel(x - 0.1, y, params.distance)) * 5;
            const gradY = (potentiel(x, y + 0.1, params.distance) - potentiel(x, y - 0.1, params.distance)) * 5;
            particle.position[0] -= gradX * particleParams.speed;
            particle.position[1] -= gradY * particleParams.speed;
        }
        particle.lifetime -= deltaTime;
        if (particle.lifetime <= 0) particles.splice(i, 1);
    });
    updateParticleSystem();
}

function updateParticleSystem() {
    particles.forEach((particle, i) => {
        const [x, y, z] = particle.position;
        const idx = i * 3;
        particlePositions[idx] = x;
        particlePositions[idx + 1] = y;
        particlePositions[idx + 2] = z;

        const color = new THREE.Color().setRGB(potentiel(x, y, params.distance), Math.abs(potentiel(x, y, params.distance)), -potentiel(x, y, params.distance));
        const cIdx = i * 4;
        particleColors[cIdx] = color.r;
        particleColors[cIdx + 1] = color.g;
        particleColors[cIdx + 2] = color.b;
        particleColors[cIdx + 3] = 1;
    });
    particleGeometry.attributes.position.needsUpdate = true;
    particleGeometry.attributes.color.needsUpdate = true;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = 0.016;
    controls.update();
    updateParticles(deltaTime);
    renderer.render(scene, camera);
}

init();
