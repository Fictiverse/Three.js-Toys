// Set up scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.z = 30;

// Add GUI controls
const gui = new dat.GUI();
const params = {
    networkSize: 64,
    connectionWeight: 1,
    updateInterval: 200,
    pattern: 'Random'
};

// Define pattern options
const patterns = ['Random', 'Center Dot', 'Clustered Center'];
gui.add(params, 'pattern', patterns).name('Pattern').onChange(initializeNetwork);
gui.add(params, 'networkSize', 2, 128, 2).name('Network Size').onChange(() => {
    initializeNetwork();
    updateCameraPosition();
});
gui.add(params, 'connectionWeight', -1, 1, 0.1).name('Connection Weight');
gui.add(params, 'updateInterval', 10, 2000, 10).name('Update Interval (ms)').onChange(() => {
    clearInterval(updateIntervalId);
    updateIntervalId = setInterval(updateNetwork, params.updateInterval);
});

// Function to update camera position based on grid size
function updateCameraPosition() {
    const gridCenter = (params.networkSize - 1) * 2.5; // Center based on spacing and size
    camera.position.set(gridCenter, gridCenter, gridCenter);
}

// Create Network
let network = [];
let updateIntervalId;

function initializeNetwork() {
    // Clear existing network
    while (scene.children.length) {
        scene.remove(scene.children[0]);
    }

    network = [];
    const spacing = 5;
    for (let i = 0; i < params.networkSize; i++) {
        const row = [];
        for (let j = 0; j < params.networkSize; j++) {
            const nodeState = getInitialState(i, j);
            const color = nodeState === 1 ? 0xffffff : 0x000000;
            const geometry = new THREE.SphereGeometry(1, 16, 16);
            const material = new THREE.MeshBasicMaterial({ color });
            const node = new THREE.Mesh(geometry, material);
            node.position.set(i * spacing, j * spacing, 0);
            scene.add(node);
            row.push({ mesh: node, state: nodeState });
        }
        network.push(row);
    }

    // Connect nodes
    for (let i = 0; i < params.networkSize; i++) {
        for (let j = 0; j < params.networkSize; j++) {
            if (i < params.networkSize - 1) {
                connectNodes(network[i][j], network[i + 1][j]);
            }
            if (j < params.networkSize - 1) {
                connectNodes(network[i][j], network[i][j + 1]);
            }
        }
    }
}

// Function to set initial state based on pattern
function getInitialState(i, j) {
    if (params.pattern === 'Center Dot') {
        return (i === Math.floor(params.networkSize / 2) && j === Math.floor(params.networkSize / 2)) ? 1 : -1;
    } else if (params.pattern === 'Clustered Center') {
        const center = Math.floor(params.networkSize / 2);
        return (Math.abs(i - center) + Math.abs(j - center) < 5) ? 1 : -1;
    } else {
        return Math.random() < 0.5 ? -1 : 1; // Random pattern
    }
}

function connectNodes(nodeA, nodeB) {
    const geometry = new THREE.BufferGeometry().setFromPoints([
        nodeA.mesh.position,
        nodeB.mesh.position
    ]);
    const material = new THREE.LineBasicMaterial({ color: 0x445588 });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
}

// Update network states
function updateNetwork() {
    for (let i = 0; i < params.networkSize; i++) {
        for (let j = 0; j < params.networkSize; j++) {
            const newState = Math.sign(
                params.connectionWeight *
                (Math.random() < 0.5 ? 1 : -1) // Simulate random influence
            );
            network[i][j].state = newState;
            network[i][j].mesh.material.color.set(newState === 1 ? 0x44ff88 : 0x885544);
        }
    }
}

// Initialize update loop
updateIntervalId = setInterval(updateNetwork, params.updateInterval);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// Initialize network and start animation
initializeNetwork();
updateCameraPosition();
animate();
