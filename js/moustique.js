// Initialisation de la scène, de la caméra et du renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Importation des OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
camera.position.z = 50;
controls.update();


// Fonction pour créer un cube de grilles
function createGridCube(size, divisions, color1, color2) {
    const group = new THREE.Group(); // Grouper toutes les grilles pour un contrôle global
    const halfSize = size / 2;

    // Tableau pour les translations et rotations des faces
    const faceConfigs = [
        { position: [0, halfSize, 0], rotation: [0, 0, 0] },           // Face supérieure (XY)
        { position: [0, -halfSize, 0], rotation: [0, 0, 0] },          // Face inférieure (XY inversée)
        { position: [0, 0, halfSize], rotation: [Math.PI / 2, 0, 0] }, // Face avant (XZ)
        { position: [0, 0, -halfSize], rotation: [-Math.PI / 2, 0, 0] }, // Face arrière (XZ inversée)
        { position: [halfSize, 0, 0], rotation: [0, 0, -Math.PI / 2] }, // Face droite (YZ)
        { position: [-halfSize, 0, 0], rotation: [0, 0, Math.PI / 2] }  // Face gauche (YZ inversée)
    ];

    // Créer et ajouter chaque face
    faceConfigs.forEach(config => {
        const grid = new THREE.GridHelper(size, divisions, color1, color2);
        grid.position.set(...config.position);
        grid.rotation.set(...config.rotation);
        group.add(grid);
    });

    return group;
}

// Créer un cube de grilles avec une taille de 100x100, 100 divisions, et des couleurs personnalisées
const gridCube = createGridCube(100, 100, 0x202020, 0x030303);
scene.add(gridCube);

// Liste des presets
const presets = {
    preset1: {
        approachSpeed: 0.02,
        repelDistance: 4,
        repelForce: 0.1,
        randomFactor: 0.0,
        redParticles: 419,
        blueParticles: 387,
    },
    preset2: {
        approachSpeed: 0.01,
        repelDistance: 6.4,
        repelForce: 0.4,
        randomFactor: 0.0,
        redParticles: 469,
        blueParticles: 761,
    },
    preset3: {
        approachSpeed: 0.2,
        repelDistance: 8.5,
        repelForce: 0.1,
        randomFactor: 0.0,
        redParticles: 1000,
        blueParticles: 19,
    },
    preset4: {
        approachSpeed: 0.1,
        repelDistance: 8.7,
        repelForce: 0.1,
        randomFactor: 0.0,
        redParticles: 106,
        blueParticles: 95,
    },    
    preset5: {
        approachSpeed: 0.2,
        repelDistance: 1.6,
        repelForce: 0.1,
        randomFactor: 0.0,
        redParticles: 4,
        blueParticles: 1000,
    },
    preset6: {
        approachSpeed: 0.08,
        repelDistance: 5.0,
        repelForce: 0.2,
        randomFactor: 0.0,
        redParticles: 188,
        blueParticles: 199,
    },
    preset7: {
        approachSpeed: 0.08,
        repelDistance: 16.0,
        repelForce: 0.2,
        randomFactor: 0.0,
        redParticles: 372,
        blueParticles: 209,
    },
    preset8: {
        approachSpeed: 0.1,
        repelDistance: 8.7,
        repelForce: 0.1,
        randomFactor: 0.0,
        redParticles: 80,
        blueParticles: 90,
    },
    preset9: {
        approachSpeed: 0.1,
        repelDistance: 16,
        repelForce: 0.1,
        randomFactor: 0.0,
        redParticles: 80,
        blueParticles: 60,
    },
};

// Variables dynamiques ajustables avec dat.GUI
const settings = {
    approachSpeed: 0.01,          // Vitesse de rapprochement
    repelDistance: 5.9,          // Distance minimale pour déclencher la répulsion
    repelForce: 0.1,             // Intensité de la force de répulsion
    randomFactor: 0.0,          // Intensité du bruit aléatoire
    redParticles: 549,             // Nombre de particules rouges
    blueParticles: 1000,            // Nombre de particules bleues
};

// Gestion des particules
const particles = [];
const redMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const blueMaterial = new THREE.MeshBasicMaterial({ color: 0x0055ff });
const geometry = new THREE.SphereGeometry(0.1, 16, 16);

// Crée les particules rouges et bleues
function createParticles() {
    // Supprime les particules existantes
    particles.forEach(p => scene.remove(p.mesh));
    particles.length = 0;

    // Crée les particules rouges
    for (let i = 0; i < settings.redParticles; i++) {
        const red = new THREE.Mesh(geometry, redMaterial);
        red.position.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        scene.add(red);
        particles.push({ mesh: red, color: 'red' });
    }

    // Crée les particules bleues
    for (let i = 0; i < settings.blueParticles; i++) {
        const blue = new THREE.Mesh(geometry, blueMaterial);
        blue.position.set(
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 5
        );
        scene.add(blue);
        particles.push({ mesh: blue, color: 'blue' });
    }
}

createParticles();

// Génère un vecteur de bruit aléatoire
function getRandomVector(factor) {
    return new THREE.Vector3(
        (Math.random() - 0.5) * factor,
        (Math.random() - 0.5) * factor,
        (Math.random() - 0.5) * factor
    );
}

// Met à jour les positions des particules
function updatePositions() {
    for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];

            const distance = p1.mesh.position.distanceTo(p2.mesh.position);
            if (distance < settings.repelDistance) {
                // Répulsion entre toutes les particules
                const direction1 = p1.mesh.position.clone().sub(p2.mesh.position).normalize();
                const direction2 = p2.mesh.position.clone().sub(p1.mesh.position).normalize();
                p1.mesh.position.add(direction1.multiplyScalar(settings.repelForce));
                p2.mesh.position.add(direction2.multiplyScalar(settings.repelForce));
            } else if (p1.color !== p2.color) {
                // Attraction entre rouges et bleues
                const direction1 = p2.mesh.position.clone().sub(p1.mesh.position).normalize();
                const direction2 = p1.mesh.position.clone().sub(p2.mesh.position).normalize();
                p1.mesh.position.add(direction1.multiplyScalar(settings.approachSpeed));
                p2.mesh.position.add(direction2.multiplyScalar(settings.approachSpeed));
            }
        }

        // Ajout d'un mouvement aléatoire
        p1.mesh.position.add(getRandomVector(settings.randomFactor));
    }
}

// Mise à jour des particules
function updateParticles() {
    particles.forEach(p => scene.remove(p.mesh)); // Supprimer les anciennes particules
    particles.length = 0;
    createParticles(); // Créer les nouvelles particules
}

// Appliquer un preset
function applyPreset(presetName) {
    // Copier les paramètres du preset dans l'objet settings
    Object.assign(settings, presets[presetName]); 
    
    // Mettre à jour les particules avec les nouveaux paramètres
    updateParticles(); 
    
    // Mettre à jour les contrôles du dat.GUI pour refléter les nouvelles valeurs
    gui.updateDisplay(); // Force la mise à jour de l'affichage du dat.GUI
}

// Animation
function animate() {
    requestAnimationFrame(animate);
    updatePositions();
    controls.update(); // Mise à jour des contrôles OrbitControls
    renderer.render(scene, camera);
}

animate();

// Configuration du menu dat.GUI
const gui = new dat.GUI();
gui.add(settings, 'approachSpeed', 0.01, 0.2, 0.01).name('Approach Speed');
gui.add(settings, 'repelDistance', 0.1, 16, 0.1).name('Repel Distance');
gui.add(settings, 'repelForce', 0.1, 2, 0.1).name('Repel Force');
gui.add(settings, 'randomFactor', 0, 0.1, 0.01).name('Random Factor');
gui.add(settings, 'redParticles', 0, 1000, 1).name('Red Particles').onChange(createParticles);
gui.add(settings, 'blueParticles', 0, 1000, 1).name('Blue Particles').onChange(createParticles);
gui.add({ preset: 'preset1' }, 'preset', Object.keys(presets))
    .name('Presets')
    .onChange(applyPreset);
