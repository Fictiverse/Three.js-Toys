// Variables de configuration par défaut
const config = {
    cellSize: 1,
    gridSize: 50,
    ruleNumber: 30,
    reset: function () { resetAutomaton(); }
};

let scene, camera, renderer, controls;
let cells = [];
let numCols, numRows;

// Initialise la scène, la caméra et le rendu
function init3DScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Créer des contrôles Orbit
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // Création des cellules
    numCols = config.gridSize;
    numRows = 20; // Fixe le nombre de lignes
    createCells();

    camera.position.z = 30;

    // Gestion de la redimension
    window.addEventListener('resize', onWindowResize, false);
}

// Fonction pour créer des cellules 3D
function createCells() {
    const geometry = new THREE.BoxGeometry(config.cellSize, config.cellSize, config.cellSize);
    const materialActive = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const materialInactive = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Initialisation de la première ligne avec une cellule centrale active
    cells = new Array(numCols).fill(0);
    cells[Math.floor(numCols / 2)] = 1; // Cellule active au centre

    // Créer les cellules et les ajouter à la scène
    for (let y = 0; y < numRows; y++) {
        for (let x = 0; x < numCols; x++) {
            const cube = new THREE.Mesh(geometry, cells[x] === 1 ? materialActive : materialInactive);
            cube.position.set(x * config.cellSize - (numCols * config.cellSize) / 2, 
                              y * config.cellSize - (numRows * config.cellSize) / 2 + config.cellSize / 2,  // Ajustement de la position pour centrer
                              0);
            scene.add(cube);
            cells[x] = { cube: cube, state: cells[x] };
        }
    }
}

// Fonction pour calculer la prochaine génération en fonction de la règle
function nextGeneration() {
    const newCells = new Array(numCols).fill(0);
    const ruleBinary = config.ruleNumber.toString(2).padStart(8, '0');

    // Vérification de l'état de chaque cellule pour déterminer la prochaine génération
    for (let i = 1; i < cells.length - 1; i++) {
        const left = cells[i - 1].state;
        const center = cells[i].state;
        const right = cells[i + 1].state;
        const pattern = (left << 2) | (center << 1) | right;
        newCells[i] = ruleBinary[7 - pattern] === '1' ? 1 : 0;
    }

    // Mettre à jour l'état des cubes
    for (let x = 0; x < cells.length; x++) {
        cells[x].state = newCells[x];
        cells[x].cube.material.color.set(cells[x].state === 1 ? 0xb1b1b1 : 0x212121);
    }
}

// Fonction pour animer l'automate
function animate() {
    requestAnimationFrame(animate);
    nextGeneration();
    controls.update(); // Met à jour les contrôles
    renderer.render(scene, camera);
}

// Gestion du redimensionnement de la fenêtre
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Réinitialise et redessine l'automate
function resetAutomaton() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    createCells();
}

// Interface avec dat.GUI
const gui = new dat.GUI();
gui.add(config, 'cellSize', 0.1, 5, 0.1).name("Cell Size").onChange(resetAutomaton);
gui.add(config, 'gridSize', 5, 100, 1).name("Grid Size").onChange(resetAutomaton);
const ruleController = gui.add(config, 'ruleNumber', 0, 255, 1).name("Rule Number").onChange(resetAutomaton);
gui.add(config, 'reset').name("Refresh Pattern");

// Initialisation
init3DScene();
animate();
