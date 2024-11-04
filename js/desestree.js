let scene, camera, renderer, surface, controls, particleSystem, particles = [];
let particlePool = [];
let particleParams = { speed: 0.2, particleCount: 10000, lifetime: 2, spawnRate: 20000 };
const params = { distance: 2.5, scale: 1 };
const mods = { mode: 'Current Flow' }; // Nouveau mode ajouté
const maxParticles = 10000; // Limite du nombre de particules actives


// Charger la texture
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load('particleTexture.png');

// Utiliser la texture dans le matériau des particules
const particleMaterial = new THREE.PointsMaterial({
    size: 0.3,
    color: 0xffffff, // Couleur de base des particules
    map: particleTexture, // Appliquer la texture
    transparent: true
});

function init() {
    console.log("Initialisation de la scène");
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.2;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 20;

    generateSurface(params.distance);

    const gui = new dat.GUI();
    gui.add(params, 'distance', 0.001, 5).step(0.001).onChange(value => {
        scene.remove(surface);
        generateSurface(value);
        resetParticles();
    });

    gui.add(particleParams, 'speed', 0.001, 1).step(0.001).name('Particle Speed');
    gui.add(particleParams, 'lifetime', 0.1, 10).step(0.1).name('Particle Lifetime');
    gui.add(particleParams, 'particleCount', 1000, 50000).step(10).name('Particle Count').onChange(() => {
        resetParticles();
    });
    gui.add(mods, 'mode', ['Surface', 'Potential', 'Gradient', 'Current Flow']).onChange(() => {
        resetParticles();
    });

    window.addEventListener('resize', onWindowResize, false);

    initParticlePool();
    animate();
}

function generateSurface(posDistance) {
    const geometry = new THREE.PlaneGeometry(26, 26, 256, 256);
    const vertices = geometry.attributes.position.array;

    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] = potentiel(vertices[i], vertices[i + 1], posDistance);
    }

    geometry.computeVertexNormals();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    const colors = [];
    const color = new THREE.Color();

    for (let i = 0; i < vertices.length; i += 3) {
        const z = vertices[i + 2];
        color.setRGB(z, 0, -z);
        colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
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


function initParticlePool() {
    for (let i = 0; i < maxParticles; i++) {
        let particle = {
            position: [(Math.random() - 0.5) * 26, (Math.random() - 0.5) * 26, 0],
            lifetime: particleParams.lifetime + (Math.random() - 0.5) * 2
        };
        particles.push(particle);
    }
}

function getParticle() {
    return particlePool.length > 0 ? particlePool.pop() : particles.shift();
}

function returnParticleToPool(particle) {
    particlePool.push(particle);
}

function generateParticle() {
    const particle = getParticle();
    particle.position[0] = (Math.random() - 0.5) * 26;
    particle.position[1] = (Math.random() - 0.5) * 26;
    particle.position[2] = potentiel(particle.position[0], particle.position[1], params.distance) * (Math.random() - 0.5) * 26;
    particle.lifetime = particleParams.lifetime;
    particles.push(particle);
}

function resetParticle(particle) {
    // Choisir aléatoirement un sommet sur la surface du mesh
    const surfaceVertices = surface.geometry.attributes.position.array;
    const index = Math.floor(Math.random() * (surfaceVertices.length / 3)) * 3;

    // Utiliser Object.assign pour mettre à jour les propriétés de la particule
    Object.assign(particle.position, {
        0: surfaceVertices[index],
        1: surfaceVertices[index + 1],
        2: surfaceVertices[index + 2]
    });

    // Assigner un nouveau lifetime avec variation aléatoire
    particle.lifetime = particleParams.lifetime + (Math.random() - 0.5) * 2;
}

function resetParticles() {
    if (particleSystem) {
        scene.remove(particleSystem);

        // Libération de la mémoire pour les géométries et matériaux
        particleGeometry.dispose();
        particleSystem.material.dispose();

        particleGeometry = null;
        particleSystem = null;
    }

    particles.length = 0;
    initParticleSystem();
}


function updateParticles(deltaTime) {
    particles.forEach(particle => {
        const [x, y] = particle.position;

        // Mise à jour de la position selon le mode choisi
        if (mods.mode === 'Potential') {
            particle.position[2] += potentiel(x, y, params.distance) * particleParams.speed;
        } else if (mods.mode === 'Gradient') {
            const gradX = (potentiel(x + 0.1, y, params.distance) - potentiel(x - 0.1, y, params.distance)) * 5;
            const gradY = (potentiel(x, y + 0.1, params.distance) - potentiel(x, y - 0.1, params.distance)) * 5;
            particle.position[0] -= gradX * particleParams.speed;
            particle.position[1] -= gradY * particleParams.speed;
            particle.position[2] = potentiel(x, y, params.distance);
        } else if (mods.mode === 'Current Flow') {
            const chargeEffect = 0.05;
            const r_pos = Math.sqrt((x - params.distance) ** 2 + y ** 2);
            const r_neg = Math.sqrt((x + params.distance) ** 2 + y ** 2);
            particle.position[0] += (x - params.distance) / r_pos * chargeEffect * particleParams.speed;
            particle.position[0] -= (x + params.distance) / r_neg * chargeEffect * particleParams.speed;
            particle.position[1] += y / r_pos * chargeEffect * particleParams.speed;
            particle.position[1] -= y / r_neg * chargeEffect * particleParams.speed;
            particle.position[2] = potentiel(x, y, params.distance);
        }

        particle.lifetime -= deltaTime;
        if (particle.lifetime <= 0) {
            resetParticle(particle);
        }
    });
    
    updateParticleSystem();
}

function updateParticleSystem() {
    const positions = [];
    const colors = [];
    const color = new THREE.Color();

    particles.forEach(particle => {
        const [x, z, y] = particle.position;
        positions.push(x, y, z);

        const dzColorValue = potentiel(x, z, params.distance);
        color.setRGB(dzColorValue, Math.abs(dzColorValue)+0.01, -dzColorValue);
        colors.push(color.r, color.g, color.b, 1);
    });

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));

    if (particleSystem) {
        scene.remove(particleSystem);
    }

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true
    });
    // Utiliser le matériau avec la texture
    const particleMaterial2 = new THREE.PointsMaterial({
        size: 0.3,
        color: 0xffffff,
        map: particleTexture, // Appliquer la texture
        transparent: true
    });

    particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
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
