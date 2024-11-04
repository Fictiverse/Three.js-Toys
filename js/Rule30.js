// Rule30.js

// Variables de configuration par défaut
const config = {
    cellSize: 2,
    canvasWidth: 1600,
    canvasHeight: 1600,
    ruleNumber: 30,
    reset: function () { resetAutomaton(); }
};

let canvas, ctx, cells, numCols, numRows;
let ruleController;
let offsetX = 0, offsetY = 0; // Variables pour le décalage de la caméra
let isDragging = false;
let dragStartX, dragStartY;

// Initialise le canvas et les cellules
function initCanvas() {
    if (!canvas) {
        canvas = document.createElement("canvas");
        document.body.appendChild(canvas);

        // Ajout d'événements pour le déplacement de la caméra avec la souris
        canvas.addEventListener("mousedown", (event) => {
            isDragging = true;
            dragStartX = event.clientX - offsetX;
            dragStartY = event.clientY - offsetY;
        });

        canvas.addEventListener("mousemove", (event) => {
            if (isDragging) {
                offsetX = event.clientX - dragStartX;
                offsetY = event.clientY - dragStartY;
                drawAutomaton();
            }
        });

        canvas.addEventListener("mouseup", () => {
            isDragging = false;
        });

        canvas.addEventListener("mouseleave", () => {
            isDragging = false;
        });
    }
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;
    ctx = canvas.getContext("2d");

    numCols = Math.floor(config.canvasWidth / config.cellSize);
    numRows = Math.floor(config.canvasHeight / config.cellSize);

    // Initialisation de la première ligne avec une cellule centrale active
    cells = new Array(numCols).fill(0);
    cells[Math.floor(numCols / 2)] = 1;
}

// Fonction pour dessiner une ligne de cellules
function drawRow(y, cells) {
    for (let x = 0; x < numCols; x++) {
        if (cells[x] === 1) {
            ctx.fillStyle = "white";
            ctx.fillRect(
                x * config.cellSize + offsetX,
                y * config.cellSize + offsetY,
                config.cellSize,
                config.cellSize
            );
        }
    }
}

// Fonction pour calculer la prochaine ligne en fonction de la règle
function nextGeneration(cells) {
    const newCells = new Array(numCols).fill(0);
    const ruleBinary = config.ruleNumber.toString(2).padStart(8, '0');

    for (let i = 1; i < cells.length - 1; i++) {
        const left = cells[i - 1];
        const center = cells[i];
        const right = cells[i + 1];
        const pattern = (left << 2) | (center << 1) | right;
        newCells[i] = ruleBinary[7 - pattern] === '1' ? 1 : 0;
    }
    return newCells;
}

// Dessine l'automate cellulaire complet
function drawAutomaton() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let currentCells = cells;
    for (let y = 0; y < numRows; y++) {
        drawRow(y, currentCells);
        currentCells = nextGeneration(currentCells);
    }
}

// Réinitialise et redessine l'automate
function resetAutomaton() {
    offsetX = 0; // Réinitialiser le décalage horizontal
    offsetY = 0; // Réinitialiser le décalage vertical
    initCanvas();
    drawAutomaton();
}

function createRulePreview(ruleNumber) {
    const rulePreviewContainer = document.getElementById("rulePreview");
    rulePreviewContainer.innerHTML = "";

    const configurations = [
        [1, 1, 1],
        [1, 1, 0],
        [1, 0, 1],
        [1, 0, 0],
        [0, 1, 1],
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 0]
    ];

    const ruleBinary = ruleNumber.toString(2).padStart(8, '0');

    configurations.forEach((config, index) => {
        const ruleBox = document.createElement("div");
        ruleBox.classList.add("rule-box");

        const cellsContainer = document.createElement("div");
        cellsContainer.classList.add("cells");

        config.forEach(cellState => {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (cellState === 0) cell.classList.add("off");
            cellsContainer.appendChild(cell);
        });

        const result = document.createElement("div");
        result.classList.add("result");
        if (ruleBinary[7 - index] === '0') result.classList.add("off");

        result.addEventListener("click", () => {
            ruleBinary[7 - index] = ruleBinary[7 - index] === '0' ? '1' : '0';
            config.ruleNumber = parseInt(ruleBinary.join(''), 2);
            createRulePreview(config.ruleNumber);
            resetAutomaton();
            ruleController.updateDisplay();
        });

        ruleBox.appendChild(cellsContainer);
        ruleBox.appendChild(result);
        rulePreviewContainer.appendChild(ruleBox);
    });
}

// Gestion des événements pour incrémenter ou décrémenter la règle
function adjustRule(delta) {
    config.ruleNumber = (config.ruleNumber + delta + 256) % 256;
    createRulePreview(config.ruleNumber);
    resetAutomaton();
    ruleController.updateDisplay();
}

window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
        adjustRule(1);
    } else if (event.key === "ArrowDown") {
        adjustRule(-1);
    }
});

window.addEventListener("wheel", (event) => {
    if (event.deltaY < 0) {
        adjustRule(1);
    } else if (event.deltaY > 0) {
        adjustRule(-1);
    }
});

// Initialisation
initCanvas();
drawAutomaton();
createRulePreview(config.ruleNumber);

// Interface avec dat.GUI
const gui = new dat.GUI();
gui.add(config, 'cellSize', 1, 10, 1).name("Cell Size").onChange(resetAutomaton);
gui.add(config, 'canvasWidth', 100, 1600, 10).name("Canvas Width").onChange(resetAutomaton);
gui.add(config, 'canvasHeight', 100, 1600, 10).name("Canvas Height").onChange(resetAutomaton);
ruleController = gui.add(config, 'ruleNumber', 0, 255, 1).name("Rule Number").onChange(() => {
    createRulePreview(config.ruleNumber);
    resetAutomaton();
});
gui.add(config, 'reset').name("Refresh Pattern");
