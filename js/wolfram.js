const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 50);
controls.update();

let nodes = [];
let links = [];
const nodeGeometry = new THREE.SphereGeometry(0.3, 4, 4);

const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff });
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

function createNode() {
    const type = Math.random() < 0.5 ? "blue" : "red"; // Couleur aléatoire
    const material = type === "blue" ? blueMaterial : redMaterial;
    const node = new THREE.Mesh(nodeGeometry, material);
    node.type = type;
    node.position.set((Math.random() * 20 - 10), (Math.random() * 20 - 10), (Math.random() * 20 - 10));
    nodes.push(node);
    scene.add(node);
}


function removeLink(link) {
    scene.remove(link.line);
}

function removeNode(node) {
    scene.remove(node);
    nodes = nodes.filter(n => n !== node);
}


// Supprimez la ligne "let greenNodes = [];" (plus nécessaire)

// Fonction pour créer un nœud vert sans tableau `greenNodes`
function createGreenNode(position) {
    const greenNode = new THREE.Mesh(nodeGeometry, greenMaterial);
    greenNode.type = "green";
    greenNode.position.copy(position);
    nodes.push(greenNode);
    scene.add(greenNode);
}

function createLink(node1, node2) {
    const points = [node1.position, node2.position];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const distance = node1.position.distanceTo(node2.position);
    const maxDistance = params.linkDistance; // La distance maximale de lien pour un lien "brillant"
    
    // Calculer l'intensité de la couleur en fonction de la distance
    const intensity = Math.max(0.1, 1 - (distance / maxDistance)); // Intensité décroît avec la distance

    // Choisir la couleur en fonction du type de lien
    let linkColor;
    if (node1.type === node2.type) {
        linkColor = node1.type === "blue" ? new THREE.Color(0x0077ff) : new THREE.Color(0xff0000);
    } else if ((node1.type === "blue" && node2.type === "red") || (node1.type === "red" && node2.type === "blue")) {
        linkColor = new THREE.Color(0x800080); // Violet pour rouge-bleu
    } else {
        linkColor = new THREE.Color(0x00ff00); // Vert pour lien vert-vert
    }

    // Ajuster l'intensité de la couleur en fonction de la distance
    linkColor.multiplyScalar(intensity); // Rend la couleur plus sombre pour les distances élevées

    const linkMaterial = new THREE.LineBasicMaterial({ color: linkColor });
    const line = new THREE.Line(geometry, linkMaterial);
    scene.add(line);
    links.push({ line, nodes: [node1, node2] });
}


// Application des règles d'évolution (ne modifie plus les verts)
function applyEvolutionRule() {
    if (frameCount % 10 !== 0) return; // Actualiser seulement toutes les 10 frames

    // Supprimer les liens existants pour actualiser
    links.forEach(link => removeLink(link));
    links = [];

    nodes.forEach((nodeA, i) => {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeB = nodes[j];
            const distance = nodeA.position.distanceTo(nodeB.position);

            if (distance < params.linkDistance && Math.random() < params.ruleProbability) {
                createLink(nodeA, nodeB);
            }

            // Création d'une particule verte au lieu de suppression mutuelle
            if (nodeA.type !== nodeB.type && (nodeA.type === "blue" || nodeA.type === "red") && distance < params.removeDistance) {
                const greenPosition = nodeA.position.clone().add(nodeB.position).multiplyScalar(0.5);
                createGreenNode(greenPosition);
                removeNode(nodeA);
                removeNode(nodeB);
            }
        }
    });
}

// Interactions entre toutes les particules dans `nodes`
function applyInteractions() {
    links.forEach(({ nodes: [nodeA, nodeB] }) => {
        const distance = nodeA.position.distanceTo(nodeB.position);
        if (distance < params.interactionRadius) {
            const direction = new THREE.Vector3().subVectors(nodeB.position, nodeA.position).normalize();

            let force = 0;
            if (nodeA.type === "blue" && nodeB.type === "blue") {
                force = -params.attractionStrength; // Repulsion pour Bleu-Bleu
            } else if (nodeA.type === "red" && nodeB.type === "red") {
                force = -params.attractionStrength; // Repulsion pour Rouge-Rouge
            } else if ((nodeA.type === "blue" && nodeB.type === "red") || (nodeA.type === "red" && nodeB.type === "blue")) {
                force = params.attractionStrength / (distance * distance); // Attraction pour Rouge-Bleu
            }

            if (distance > 0.5) {
                const attractionForce = direction.multiplyScalar(force);
                nodeA.position.add(attractionForce);
                nodeB.position.add(attractionForce.negate());
            }
        }
    });

    // Répulsion des particules vertes sur toutes les autres
    nodes.forEach(greenNode => {
        if (greenNode.type === "green") {
            nodes.forEach(otherNode => {
                if (otherNode !== greenNode) {
                    const distance = greenNode.position.distanceTo(otherNode.position);
                    if (distance < params.interactionRadius) {
                        const direction = new THREE.Vector3().subVectors(otherNode.position, greenNode.position).normalize();
                        const repulsionForce = direction.multiplyScalar(params.attractionStrength);
                        otherNode.position.add(repulsionForce);
                    }
                }
            });
        }
    });
}





// Interface utilisateur avec dat.GUI
const gui = new dat.GUI();
const params = {
    linkDistance: 20, // Maximum
    removeDistance: 0.5,
    ruleProbability: 1, // 100%
    attractionStrength: 0.05,
    interactionRadius: 20, // Maximum
    addNodes: function() {
        for (let i = 0; i < 10; i++) {
            createNode();
        }
        applyEvolutionRule();
    },
    evolve: true
};

gui.add(params, 'linkDistance', 0, 20).name('Distance de Lien').onChange(applyEvolutionRule);
gui.add(params, 'removeDistance', 0, 5).name('Distance de Suppression'); // Ajout de la distance de suppression
gui.add(params, 'ruleProbability', 0, 1).name('Probabilité de Lien').onChange(applyEvolutionRule);
gui.add(params, 'attractionStrength', 0, 1).name('Force d’Attraction');
gui.add(params, 'interactionRadius', 0, 20).name('Rayon d’Interaction');
gui.add(params, 'addNodes').name('Ajouter 10 Nœuds');
gui.add(params, 'evolve').name('Evolution Automatique');

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);

let frameCount = 0;
function animate() {
    frameCount++;
    if (params.evolve) applyEvolutionRule();
    applyInteractions();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});