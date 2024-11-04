let scene, camera, renderer;
let particles = [], vectorField = [];
let targetX = 0, targetY = 0;
const params = {
    particleCount: 200,
    fieldSize: 10,
    gridSpacing: 0.5,
    vectorScale: 0.5,
    a: 0.1, // Coefficient pour ajuster la dynamique du champ
    b: 0.1,
    c: 0.1,
    d: 0.1,
    rotationStrength: 3,
    spawnInterval: 100, // Millisecondes entre chaque spawn de particule
    particleLife: 3000, // Durée de vie des particules en millisecondes
    spawnParticles: () => spawnParticles(),
    updateField: () => updateVectorField(),
};

init();
animate();

function init() {
    // Scene and Camera
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(
        window.innerWidth / -100, window.innerWidth / 100, 
        window.innerHeight / 100, window.innerHeight / -100, 
        1, 1000
    );
    camera.position.set(0, 0, 10);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // GUI
    const gui = new dat.GUI();
    gui.add(params, 'particleCount', 100, 500, 50).name('Nombre de Particules').onFinishChange(spawnParticles);
    gui.add(params, 'fieldSize', 5, 20, 1).name('Taille du Champ').onFinishChange(updateVectorField);
    gui.add(params, 'gridSpacing', 0.3, 2, 0.1).name('Espacement de la Grille').onFinishChange(updateVectorField);
    gui.add(params, 'vectorScale', 0.1, 2, 0.1).name('Taille des Vecteurs').onFinishChange(updateVectorField);
    gui.add(params, 'a', 0.1, 3, 0.1).name('Coefficient a').onFinishChange(updateVectorField);
    gui.add(params, 'b', 0.1, 3, 0.1).name('Coefficient b').onFinishChange(updateVectorField);
    gui.add(params, 'c', 0.1, 3, 0.1).name('Coefficient c').onFinishChange(updateVectorField);
    gui.add(params, 'd', 0.1, 3, 0.1).name('Coefficient d').onFinishChange(updateVectorField);
    gui.add(params, 'rotationStrength', 0, 3, 0.1).name('Rotation Strength').onFinishChange(updateVectorField);
    gui.add(params, 'spawnParticles').name('Réinitialiser Particules');

    // Vector Field
    createVectorField();

    // Particles
    spawnParticles();

    // Mouse Controls
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('click', onMouseClick);
}

function createVectorField() {
    vectorField.forEach(arrow => scene.remove(arrow));
    vectorField = [];

    const arrowMaterial = new THREE.LineBasicMaterial({ color: 0x00ffcc });
    for (let x = -params.fieldSize; x <= params.fieldSize; x += params.gridSpacing) {
        for (let y = -params.fieldSize; y <= params.fieldSize; y += params.gridSpacing) {
            const arrowDirection = calculateVector(x, y);
            const arrow = createArrow(x, y, arrowDirection.x, arrowDirection.y, arrowMaterial);
            vectorField.push(arrow);
            scene.add(arrow);
        }
    }
}

function spawnParticles() {
    particles.forEach(p => scene.remove(p));
    particles = [];

    const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xff9900 });
    const particleGeometry = new THREE.CircleGeometry(0.075, 6);

    for (let i = 0; i < params.particleCount; i++) {
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(Math.random() * params.fieldSize * 2 - params.fieldSize, Math.random() * params.fieldSize * 2 - params.fieldSize, 0);
        particles.push(particle);
        scene.add(particle);
    }
}

function createArrow(x, y, dx, dy, material) {
    const dir = new THREE.Vector3(dx, dy, 0).normalize().multiplyScalar(params.vectorScale);
    const origin = new THREE.Vector3(x, y, 0);
    const length = dir.length();
    const arrowHelper = new THREE.ArrowHelper(dir.clone().normalize(), origin, length, 0x00ffcc);
    return arrowHelper;
}

// Fonction pour calculer le champ vectoriel avec rotation autour du point de convergence
function calculateVector(x, y) {
    const dx = targetX - x;
    const dy = targetY - y;
    
    const attractionX = params.a * dx - params.b * x;
    const attractionY = params.c * dy - params.d * y;
    const rotationX = -dy * params.rotationStrength;
    const rotationY = dx * params.rotationStrength;

    const resultX = attractionX + rotationX;
    const resultY = attractionY + rotationY;

    const magnitude = Math.sqrt(resultX * resultX + resultY * resultY);
    return { x: (resultX / magnitude) * params.vectorScale, y: (resultY / magnitude) * params.vectorScale };
}


function updateVectorField() {
    createVectorField();
    spawnParticles(); // Reset particles when field is updated
}

function onMouseClick(event) {
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    const vector = new THREE.Vector3(mouseX, mouseY, 0).unproject(camera);
    targetX = vector.x;
    targetY = vector.y;

    updateVectorField();
}

function animate() {
    requestAnimationFrame(animate);

    particles.forEach(particle => {
        const vector = calculateVector(particle.position.x, particle.position.y);
        particle.position.x += vector.x * 0.05;
        particle.position.y += vector.y * 0.05;
    });

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.left = window.innerWidth / -100;
    camera.right = window.innerWidth / 100;
    camera.top = window.innerHeight / 100;
    camera.bottom = window.innerHeight / -100;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
