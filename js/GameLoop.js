const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let debugPanel = document.getElementById('externalDebugPanel');
if (!debugPanel) {
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'flex-start';
    wrapper.style.gap = '20px'; 

    canvas.parentNode.insertBefore(wrapper, canvas);
    wrapper.appendChild(canvas);

    debugPanel = document.createElement('div');
    debugPanel.id = 'externalDebugPanel';
    debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    debugPanel.style.border = '2px solid #00ffcc';
    debugPanel.style.borderRadius = '8px';
    debugPanel.style.padding = '15px';
    debugPanel.style.fontFamily = 'Courier New';
    debugPanel.style.fontSize = '16px';
    debugPanel.style.color = '#00ffcc';
    debugPanel.style.display = 'none'; 
    debugPanel.style.width = '360px';
    debugPanel.style.minWidth = '360px';
    debugPanel.style.maxWidth = '360px';
    debugPanel.style.boxSizing = 'border-box';
    debugPanel.style.flexShrink = '0';
    debugPanel.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.3)';

    wrapper.appendChild(debugPanel);
}

const TILE_SIZE = 32;
const COLS = 20;
const ROWS = 20;

// NUEVO: Sistema de carga de Sprite Sheet
const spriteSheet = new Image();
spriteSheet.src = 'img/sprites.png'; // Ruta donde guardarás tu imagen final

const BASE_MAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,2,1],
    [1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,0,1,1,0,0,0,0,1,1,0,1,1,1,1,1],
    [1,1,1,1,1,0,1,1,1,0,0,1,1,1,0,1,1,1,1,1], 
    [1,1,1,1,1,0,1,0,0,0,0,0,0,1,0,1,1,1,1,1], 
    [3,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,3], 
    [1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1], 
    [1,1,1,1,1,0,1,0,0,0,0,0,0,1,0,1,1,1,1,1], 
    [1,1,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,1,1],
    [1,2,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0,0,2,1],
    [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// 4 mapas principales. A partir del nivel 5 se vuelven a usar,
// pero la velocidad/tiempos de la IA siguen aumentando con currentLevel.
function createLevelMap(base, changes) {
    const copy = JSON.parse(JSON.stringify(base));
    for (const [row, col, value] of changes) copy[row][col] = value;
    return copy;
}

const LEVEL_MAPS = [
    JSON.parse(JSON.stringify(BASE_MAP)),
    createLevelMap(BASE_MAP, [
        [2,2,0],[2,3,0],[2,16,0],[2,17,0],
        [4,2,0],[4,3,0],[4,16,0],[4,17,0],
        [14,2,0],[14,3,0],[14,16,0],[14,17,0],
        [16,2,0],[16,17,0],
        [3,3,1],[3,16,1]
    ]),
    createLevelMap(BASE_MAP, [
        [2,6,0],[2,7,0],[2,12,0],[2,13,0],
        [4,6,0],[4,13,0],[14,6,0],[14,13,0],
        [16,6,0],[16,13,0],
        [13,4,1],[13,15,1],[15,9,1],[15,10,1]
    ]),
    createLevelMap(BASE_MAP, [
        [2,2,0],[2,3,0],[2,6,0],[2,7,0],[2,12,0],[2,13,0],[2,16,0],[2,17,0],
        [4,2,0],[4,17,0],[14,2,0],[14,17,0],[16,2,0],[16,17,0],
        [1,4,1],[1,15,1],[3,6,1],[3,13,1],
        [13,6,1],[13,13,1],[17,4,1],[17,15,1]
    ])
];

function getMapForLevel(level) {
    const index = (level - 1) % LEVEL_MAPS.length;
    return JSON.parse(JSON.stringify(LEVEL_MAPS[index]));
}

let mapMatrix = getMapForLevel(1);
let gameState = 'TITLE'; 
let readyTimer = 0;
let deathTimer = 0;

let debugMode = false;
let currentFps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let currentTargets = { alpha: null, beta: null, gamma: null, delta: null };

let mainMenuIndex = 0;
const mainOptions = ['Jugar Campaña (4 Mapas)', 'Niveles Guardados', 'Ver Récords (Top 10)', 'Editor de Niveles', 'Instrucciones', 'Créditos'];
let pauseMenuIndex = 0;
const pauseOptions = ['Continuar', 'Reiniciar', 'Salir al Menú'];

let playerName = '';
let highScores = [];
let scoreSubmitted = false;
let savedLevels = [];
let levelMenuIndex = 0;

const DIRS = { 'UP': { dx: 0, dy: -1 }, 'DOWN': { dx: 0, dy: 1 }, 'LEFT': { dx: -1, dy: 0 }, 'RIGHT': { dx: 1, dy: 0 }, 'NONE': { dx: 0, dy: 0 } };
const OPPOSITE_DIR = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT', 'NONE': 'NONE' };

let enemyMode = 'SCATTER';
let modeBeforeFrightened = 'SCATTER';
let modeTimer = 0;
let currentLevel = 1;
let levelTemplateMap = getMapForLevel(1);

// La dificultad se calcula por nivel. Estos valores son la base del nivel 1.
const BASE_CHASE_DURATION = 60 * 15;
const BASE_SCATTER_DURATION = 60 * 5;
const BASE_FRIGHTENED_DURATION = 60 * 7;
let CHASE_DURATION = BASE_CHASE_DURATION;
let SCATTER_DURATION = BASE_SCATTER_DURATION;
let FRIGHTENED_DURATION = BASE_FRIGHTENED_DURATION;
let enemiesEatenThisPowerup = 0;
let floatingTexts = [];
let currentPaths = { alpha: [], beta: [], gamma: [], delta: [] };


let player = { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE, speed: 2, currentDir: 'NONE', nextDir: 'NONE', color: '#00ffcc', size: TILE_SIZE - 4 };
let portalCooldown = 0; 

let enemyAlpha = { x: 9 * TILE_SIZE, y: 6 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#ff0044', active: true, isDead: false, releaseDots: 0, type: 0, size: TILE_SIZE - 4, state: 'SPAWN', spawnTimer: 45 };
let enemyBeta = { x: 9 * TILE_SIZE, y: 8 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#ffb8ff', active: false, isDead: false, releaseDots: 20, type: 1, size: TILE_SIZE - 4, state: 'SPAWN', spawnTimer: 45 };
let enemyGamma = { x: 10 * TILE_SIZE, y: 8 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#00aaff', active: false, isDead: false, releaseDots: 50, type: 2, size: TILE_SIZE - 4, state: 'SPAWN', spawnTimer: 45 };
let enemyDelta = { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#ffaa00', active: false, isDead: false, releaseDots: 90, type: 3, size: TILE_SIZE - 4, state: 'SPAWN', spawnTimer: 45 };
const enemiesList = [enemyAlpha, enemyBeta, enemyGamma, enemyDelta];

let score = 0;
let lives = 3;
let dotsEatenThisLife = 0;
let dots = [];
let dotsRemaining = 0;

function initDots() {
    dots = [];
    dotsRemaining = 0;
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if ((mapMatrix[row][col] === 0 || mapMatrix[row][col] === 2) && col > 0 && col < COLS - 1) {
                if (row >= 7 && row <= 10 && col >= 6 && col <= 13) continue;
                let isPowerUp = mapMatrix[row][col] === 2;
                dots.push({ x: col * TILE_SIZE + TILE_SIZE / 2, y: row * TILE_SIZE + TILE_SIZE / 2, radius: isPowerUp ? 8 : 3, isPowerUp: isPowerUp, collected: false });
                dotsRemaining++;
            }
        }
    }
}

function applyDifficultySettings() {
    // Nivel 1 = 2 px/frame. Cada nivel aumenta poco a poco sin romper el movimiento por Tiles.
    const speedBoost = Math.min(1.5, (currentLevel - 1) * 0.15);
    const normalSpeed = 2 + speedBoost;
    enemiesList.forEach(e => e.baseSpeed = normalSpeed);

    // Menos tiempo en SCATTER y más tiempo persiguiendo conforme sube el nivel.
    CHASE_DURATION = Math.max(60 * 8, BASE_CHASE_DURATION - (currentLevel - 1) * 60);
    SCATTER_DURATION = Math.max(60 * 2, BASE_SCATTER_DURATION - (currentLevel - 1) * 20);
    FRIGHTENED_DURATION = Math.max(60 * 3, BASE_FRIGHTENED_DURATION - (currentLevel - 1) * 18);

    // Los enemigos salen antes de la base en niveles altos.
    enemyBeta.releaseDots = Math.max(8, 20 - (currentLevel - 1) * 2);
    enemyGamma.releaseDots = Math.max(18, 50 - (currentLevel - 1) * 4);
    enemyDelta.releaseDots = Math.max(30, 90 - (currentLevel - 1) * 6);
}

function isPlayerAreaReachable(testMap) {
    const start = { c: 9, r: 3 };
    const queue = [start];
    const visited = new Set([`${start.c},${start.r}`]);
    const isGhostHouse = (c, r) => r >= 7 && r <= 10 && c >= 6 && c <= 13;

    while (queue.length) {
        const node = queue.shift();
        for (const dir of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
            let nc = node.c + DIRS[dir].dx;
            const nr = node.r + DIRS[dir].dy;
            if (nc < 0) nc = COLS - 1;
            if (nc >= COLS) nc = 0;
            if (nr < 0 || nr >= ROWS || testMap[nr][nc] === 1 || isGhostHouse(nc, nr)) continue;
            const key = `${nc},${nr}`;
            if (!visited.has(key)) { visited.add(key); queue.push({ c: nc, r: nr }); }
        }
    }

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (testMap[r][c] !== 1 && !isGhostHouse(c, r) && !visited.has(`${c},${r}`)) return false;
        }
    }
    return true;
}

function applyLevelMapComplexity() {
    // Añade obstáculos gradualmente, pero solo conserva los que no rompen las rutas del mapa.
    const candidates = [
        {r:3,c:3},{r:3,c:16},{r:13,c:3},{r:13,c:16},{r:5,c:3},{r:5,c:16},
        {r:15,c:6},{r:15,c:13},{r:1,c:6},{r:1,c:13},{r:9,c:3}
    ];
    const wallsToTry = Math.min(candidates.length, Math.floor((currentLevel - 1) / 2));
    for (let i = 0; i < wallsToTry; i++) {
        const {r, c} = candidates[i];
        if (mapMatrix[r][c] !== 0) continue;
        mapMatrix[r][c] = 1;
        if (!isPlayerAreaReachable(mapMatrix)) mapMatrix[r][c] = 0;
    }
}

function resetPositions() {
    player.x = 9 * TILE_SIZE; player.y = 3 * TILE_SIZE;
    player.currentDir = 'NONE'; player.nextDir = 'NONE'; player.size = TILE_SIZE - 4;
    dotsEatenThisLife = 0;
    portalCooldown = 0;
    enemiesEatenThisPowerup = 0;
    floatingTexts = [];
    currentPaths = { alpha: [], beta: [], gamma: [], delta: [] };

    enemyAlpha.x = 9 * TILE_SIZE; enemyAlpha.y = 6 * TILE_SIZE; enemyAlpha.currentDir = 'UP'; enemyAlpha.active = true; enemyAlpha.isDead = false; enemyAlpha.state = 'SPAWN'; enemyAlpha.spawnTimer = 45; resetEnemyNavigation(enemyAlpha);
    enemyBeta.active = false; enemyBeta.x = 9 * TILE_SIZE; enemyBeta.y = 8 * TILE_SIZE; enemyBeta.currentDir = 'UP'; enemyBeta.isDead = false; enemyBeta.state = 'SPAWN'; enemyBeta.spawnTimer = 45; resetEnemyNavigation(enemyBeta);
    enemyGamma.active = false; enemyGamma.x = 10 * TILE_SIZE; enemyGamma.y = 8 * TILE_SIZE; enemyGamma.currentDir = 'UP'; enemyGamma.isDead = false; enemyGamma.state = 'SPAWN'; enemyGamma.spawnTimer = 45; resetEnemyNavigation(enemyGamma);
    enemyDelta.active = false; enemyDelta.x = 9 * TILE_SIZE; enemyDelta.y = 9 * TILE_SIZE; enemyDelta.currentDir = 'UP'; enemyDelta.isDead = false; enemyDelta.state = 'SPAWN'; enemyDelta.spawnTimer = 45; resetEnemyNavigation(enemyDelta);

    enemyMode = 'SCATTER';
    modeBeforeFrightened = 'SCATTER';
    modeTimer = 0;
    applyDifficultySettings();
}

function fullResetGame() {
    score = 0; lives = 3; scoreSubmitted = false; playerName = ''; currentLevel = 1;
    levelTemplateMap = getMapForLevel(currentLevel);
    mapMatrix = JSON.parse(JSON.stringify(levelTemplateMap));
    applyDifficultySettings();
    initDots(); resetPositions();
}

function startNextLevel() {
    currentLevel++;
    // Cada nivel carga un diseño diferente. Después del nivel 4 los mapas rotan,
    // mientras la dificultad continúa aumentando normalmente.
    levelTemplateMap = getMapForLevel(currentLevel);
    mapMatrix = JSON.parse(JSON.stringify(levelTemplateMap));
    applyDifficultySettings();
    initDots();
    resetPositions();
    gameState = 'READY';
    readyTimer = 120;
}

function loseLife() {
    lives--;
    if (lives > 0) {
        resetPositions();
        gameState = 'READY';
        readyTimer = 120; 
    } else {
        gameState = 'ENTER_NAME';
        debugPanel.style.display = 'none'; 
    }
}

function submitScore() {
    if (scoreSubmitted || !playerName.trim()) return;
    scoreSubmitted = true;
    fetch('http://localhost:3000/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName.trim(), score: score })
    }).then(() => { gameState = 'GAMEOVER'; }).catch(() => { gameState = 'GAMEOVER'; });
}

function fetchScores() {
    fetch('http://localhost:3000/api/scores')
    .then(res => res.json())
    .then(data => { highScores = data; gameState = 'MENU_SCORES'; })
    .catch(() => { highScores = []; gameState = 'MENU_SCORES'; });
}

function fetchLevels() {
    fetch('http://localhost:3000/api/levels')
    .then(res => res.json())
    .then(data => { savedLevels = data; gameState = 'MENU_LEVELS'; levelMenuIndex = 0; })
    .catch(() => { savedLevels = []; gameState = 'MENU_LEVELS'; });
}

canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); });

canvas.addEventListener('mousedown', (e) => {
    if (gameState === 'EDITOR') {
        if (e.button === 2) return; 
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        const col = Math.floor(mouseX / TILE_SIZE);
        const row = Math.floor(mouseY / TILE_SIZE);

        if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
            mapMatrix[row][col] = (mapMatrix[row][col] + 1) % 4;
        }
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') { debugMode = !debugMode; e.preventDefault(); return; }

    if (gameState === 'TITLE') { if (e.key === 'Enter') gameState = 'START'; return; }

    if (gameState === 'START') {
        if (e.key === 'ArrowUp') mainMenuIndex = mainMenuIndex - 1 < 0 ? mainOptions.length - 1 : mainMenuIndex - 1;
        if (e.key === 'ArrowDown') mainMenuIndex = mainMenuIndex + 1 >= mainOptions.length ? 0 : mainMenuIndex + 1;
        if (e.key === 'Enter') {
            if (mainMenuIndex === 0) { mapMatrix = getMapForLevel(1); fullResetGame(); gameState = 'READY'; readyTimer = 120; }
            else if (mainMenuIndex === 1) { fetchLevels(); }
            else if (mainMenuIndex === 2) { fetchScores(); }
            else if (mainMenuIndex === 3) { mapMatrix = JSON.parse(JSON.stringify(BASE_MAP)); gameState = 'EDITOR'; }
            else if (mainMenuIndex === 4) { gameState = 'MENU_INSTRUCTIONS'; }
            else if (mainMenuIndex === 5) { gameState = 'MENU_CREDITS'; }
        }
        return;
    }

    if (gameState === 'MENU_INSTRUCTIONS' || gameState === 'MENU_CREDITS') {
        if (e.key === 'Escape' || e.key === 'Enter') gameState = 'START';
        return;
    }

    if (gameState === 'MENU_LEVELS') {
        if (e.key === 'Escape') { gameState = 'START'; return; }
        if (savedLevels.length > 0) {
            if (e.key === 'ArrowUp') levelMenuIndex = levelMenuIndex - 1 < 0 ? savedLevels.length - 1 : levelMenuIndex - 1;
            if (e.key === 'ArrowDown') levelMenuIndex = levelMenuIndex + 1 >= savedLevels.length ? 0 : levelMenuIndex + 1;
            if (e.key === 'Enter') { mapMatrix = JSON.parse(JSON.stringify(savedLevels[levelMenuIndex].matrix)); fullResetGame(); gameState = 'READY'; readyTimer = 120; }
        }
        return;
    }
    
    if (gameState === 'EDITOR') {
        if (e.key === 'Escape') gameState = 'START'; 
        if (e.key.toLowerCase() === 's') {
            const levelName = prompt("Ingresa un nombre para tu nivel:");
            if (levelName) {
                fetch('http://localhost:3000/api/levels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: levelName, matrix: mapMatrix }) })
                .then(() => alert("¡Nivel guardado!"))
                .catch(() => alert("Error al guardar nivel."));
            }
        }
        return;
    }

    if (gameState === 'MENU_SCORES') {
        if (e.key === 'Escape' || e.key === 'Enter') gameState = 'START';
        return;
    }
    
    if (gameState === 'ENTER_NAME') {
        if (e.key === 'Enter') submitScore();
        else if (e.key === 'Backspace') playerName = playerName.slice(0, -1);
        else if (e.key.length === 1 && playerName.length < 10) playerName += e.key.toUpperCase();
        return;
    }

    if (gameState === 'GAMEOVER' && e.key === 'Enter') { gameState = 'START'; return; }
    if (gameState === 'VICTORY' && e.key === 'Enter') { startNextLevel(); return; }

    if (gameState === 'PLAYING' || gameState === 'READY') {
        if (e.key === 'Escape') { gameState = 'PAUSED'; pauseMenuIndex = 0; return; }
        if (e.key === 'ArrowUp') player.nextDir = 'UP';
        if (e.key === 'ArrowDown') player.nextDir = 'DOWN';
        if (e.key === 'ArrowLeft') player.nextDir = 'LEFT';
        if (e.key === 'ArrowRight') player.nextDir = 'RIGHT';
    } else if (gameState === 'PAUSED') {
        if (e.key === 'Escape') { gameState = 'PLAYING'; return; }
        if (e.key === 'ArrowUp') pauseMenuIndex = pauseMenuIndex - 1 < 0 ? pauseOptions.length - 1 : pauseMenuIndex - 1;
        if (e.key === 'ArrowDown') pauseMenuIndex = pauseMenuIndex + 1 >= pauseOptions.length ? 0 : pauseMenuIndex + 1;
        if (e.key === 'Enter') {
            if (pauseMenuIndex === 0) gameState = 'PLAYING';
            else if (pauseMenuIndex === 1) { fullResetGame(); gameState = 'READY'; readyTimer = 120; }
            else if (pauseMenuIndex === 2) gameState = 'START';
        }
    }
});

function getMapTile(col, row) {
    if (col < 0) col = COLS - 1; 
    if (col >= COLS) col = 0;
    if (row < 0 || row >= ROWS) return 1;
    return mapMatrix[row][col];
}

function getTileDistance(c1, r1, c2, r2) {
    let dc = Math.abs(c2 - c1);
    let dr = Math.abs(r2 - r1);
    if (dc > COLS / 2) dc = COLS - dc; 
    return Math.hypot(dc, dr);
}

function getDistance(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

function isPlayerColliding(newX, newY) {
    const leftCol = Math.floor(newX / TILE_SIZE);
    const rightCol = Math.floor((newX + player.size - 1) / TILE_SIZE);
    const topRow = Math.floor(newY / TILE_SIZE);
    const bottomRow = Math.floor((newY + player.size - 1) / TILE_SIZE);

    if (topRow < 0 || bottomRow >= ROWS || leftCol < 0 || rightCol >= COLS) return false; 
    if ((topRow >= 7 && topRow <= 10 && leftCol >= 6 && leftCol <= 13) ||
        (bottomRow >= 7 && bottomRow <= 10 && rightCol >= 6 && rightCol <= 13)) return true; 

    if (mapMatrix[topRow][leftCol] === 1 || mapMatrix[topRow][rightCol] === 1 || 
        mapMatrix[bottomRow][leftCol] === 1 || mapMatrix[bottomRow][rightCol] === 1) return true;
    return false;
}

function updatePlayer() {
    const isAligned = (player.x % TILE_SIZE === 0) && (player.y % TILE_SIZE === 0);
    if (isAligned) {
        const col = player.x / TILE_SIZE, row = player.y / TILE_SIZE;
        if (player.nextDir !== 'NONE') {
            let nextCol = col + DIRS[player.nextDir].dx;
            let nextRow = row + DIRS[player.nextDir].dy;
            let isEnteringSpawn = (nextRow >= 7 && nextRow <= 10 && nextCol >= 6 && nextCol <= 13);
            if (!isEnteringSpawn && getMapTile(nextCol, nextRow) !== 1) player.currentDir = player.nextDir;
        }
        if (player.currentDir !== 'NONE') {
            const currDx = DIRS[player.currentDir].dx, currDy = DIRS[player.currentDir].dy;
            if (getMapTile(col + currDx, row + currDy) === 1) player.currentDir = 'NONE';
        }
    }
    
    let nextX = player.x + DIRS[player.currentDir].dx * player.speed;
    let nextY = player.y + DIRS[player.currentDir].dy * player.speed;
    
    if (!isPlayerColliding(nextX, player.y)) player.x = nextX;
    if (!isPlayerColliding(player.x, nextY)) player.y = nextY;
    
    if (player.x < -TILE_SIZE) player.x = canvas.width;
    if (player.x > canvas.width) player.x = -TILE_SIZE;
}

function nearestWalkableTarget(targetCol, targetRow) {
    let tc = Math.round(targetCol);
    let tr = Math.round(targetRow);
    tc = ((tc % COLS) + COLS) % COLS;
    tr = Math.max(0, Math.min(ROWS - 1, tr));

    if (getMapTile(tc, tr) !== 1) return { c: tc, r: tr };

    let best = null;
    let bestDist = Infinity;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (getMapTile(c, r) === 1) continue;
            const d = getTileDistance(c, r, tc, tr);
            if (d < bestDist) { bestDist = d; best = { c, r }; }
        }
    }
    return best || { c: tc, r: tr };
}

function findPath(startCol, startRow, targetCol, targetRow) {
    const target = nearestWalkableTarget(targetCol, targetRow);
    const startKey = `${startCol},${startRow}`;
    const queue = [{ c: startCol, r: startRow }];
    const cameFrom = new Map();
    cameFrom.set(startKey, null);

    while (queue.length) {
        const node = queue.shift();
        if (node.c === target.c && node.r === target.r) break;

        for (const dir of ['UP', 'LEFT', 'DOWN', 'RIGHT']) {
            const nc = node.c + DIRS[dir].dx;
            const nr = node.r + DIRS[dir].dy;
            // No hacemos wrap directo en BFS: evita que un enemigo atraviese paredes
            // al intentar cruzar desde un borde al otro. Los portales se manejan aparte.
            if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS || getMapTile(nc, nr) === 1) continue;
            const key = `${nc},${nr}`;
            if (!cameFrom.has(key)) {
                cameFrom.set(key, { c: node.c, r: node.r });
                queue.push({ c: nc, r: nr });
            }
        }
    }

    const targetKey = `${target.c},${target.r}`;
    if (!cameFrom.has(targetKey)) return [];

    const path = [];
    let current = { c: target.c, r: target.r };
    while (current && `${current.c},${current.r}` !== startKey) {
        path.push(current);
        current = cameFrom.get(`${current.c},${current.r}`);
    }
    path.reverse();
    return path;
}

function getEnemyPathKey(enemy) {
    if (enemy === enemyAlpha) return 'alpha';
    if (enemy === enemyBeta) return 'beta';
    if (enemy === enemyGamma) return 'gamma';
    return 'delta';
}

function getAllPortals() {
    const portals = [];
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (mapMatrix[r][c] === 3) portals.push({ c, r });
        }
    }
    return portals;
}

function resetEnemyNavigation(enemy) {
    enemy._moveTarget = null;
    enemy._scatterIndex = 0;
}

function teleportEnemyIfOnPortal(enemy) {
    const col = Math.round(enemy.x / TILE_SIZE);
    const row = Math.round(enemy.y / TILE_SIZE);
    if (getMapTile(col, row) !== 3) return false;

    const portals = getAllPortals().filter(p => p.c !== col || p.r !== row);
    if (portals.length === 0) return false;

    // Elegimos el otro portal. Si algún nivel tiene más de dos, usa uno distinto al actual.
    const dest = portals[0];
    enemy.x = dest.c * TILE_SIZE;
    enemy.y = dest.r * TILE_SIZE;
    enemy._moveTarget = null;
    return true;
}

function getEnemyMove(enemy, targetCol, targetRow) {
    // Los enemigos se mueven de centro de Tile a centro de Tile.
    // Esto evita que una velocidad decimal (FRIGHTENED / dificultad) haga que
    // nunca vuelvan a caer exactamente en múltiplos de 32 y atraviesen muros.

    if (!enemy._moveTarget) {
        const col = Math.round(enemy.x / TILE_SIZE);
        const row = Math.round(enemy.y / TILE_SIZE);

        // Al iniciar una nueva decisión siempre los alineamos exactamente con la cuadrícula.
        enemy.x = col * TILE_SIZE;
        enemy.y = row * TILE_SIZE;

        const path = findPath(col, row, targetCol, targetRow);
        currentPaths[getEnemyPathKey(enemy)] = path;

        if (path.length === 0) {
            enemy.currentDir = 'NONE';
            return;
        }

        const next = path[0];

        // Protección extra: jamás fijamos como destino un muro.
        if (getMapTile(next.c, next.r) === 1) {
            enemy.currentDir = 'NONE';
            return;
        }

        const dc = next.c - col;
        const dr = next.r - row;

        if (dc === 1) enemy.currentDir = 'RIGHT';
        else if (dc === -1) enemy.currentDir = 'LEFT';
        else if (dr === 1) enemy.currentDir = 'DOWN';
        else if (dr === -1) enemy.currentDir = 'UP';
        else {
            enemy.currentDir = 'NONE';
            return;
        }

        enemy._moveTarget = {
            c: next.c,
            r: next.r,
            x: next.c * TILE_SIZE,
            y: next.r * TILE_SIZE
        };
    }

    const target = enemy._moveTarget;
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const step = Math.max(0.01, enemy.speed);

    if (Math.abs(dx) > 0.001) {
        enemy.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
    } else if (Math.abs(dy) > 0.001) {
        enemy.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
    }

    // Llegó exactamente al siguiente Tile: snap y calcula una nueva ruta en el próximo frame.
    if (Math.abs(enemy.x - target.x) < 0.001 && Math.abs(enemy.y - target.y) < 0.001) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy._moveTarget = null;
        teleportEnemyIfOnPortal(enemy);
    }
}

function updateInactiveEnemy(enemy) {
    enemy.state = 'SPAWN';
    if (enemy.x % TILE_SIZE === 0 && enemy.y % TILE_SIZE === 0) {
        let col = Math.floor(enemy.x / TILE_SIZE), row = Math.floor(enemy.y / TILE_SIZE);
        let nextCol = col + DIRS[enemy.currentDir].dx, nextRow = row + DIRS[enemy.currentDir].dy;
        if (nextRow < 8 || nextRow > 9 || nextCol < 8 || nextCol > 11) enemy.currentDir = OPPOSITE_DIR[enemy.currentDir];
    }
    enemy.x += DIRS[enemy.currentDir].dx * 1;
    enemy.y += DIRS[enemy.currentDir].dy * 1;
}

function setLivingEnemiesState(newState) {
    enemiesList.forEach(e => {
        if (e.active && e.state !== 'RETURN' && e.state !== 'SPAWN') e.state = newState;
    });
}

function releaseEnemy(enemy) {
    enemy.active = true;
    enemy.state = 'SPAWN';
    enemy.spawnTimer = 30;
    enemy.x = 9 * TILE_SIZE;
    enemy.y = 8 * TILE_SIZE;
    enemy.currentDir = 'UP';
    resetEnemyNavigation(enemy);
}


// Rutas de patrulla para SCATTER. En vez de llegar a una esquina y quedarse quietos,
// cada enemigo recorre varios puntos de su zona continuamente.
const SCATTER_PATROLS = {
    alpha: [{c:18,r:1},{c:18,r:3},{c:14,r:3},{c:14,r:1}],
    beta:  [{c:1,r:1},{c:1,r:3},{c:5,r:3},{c:5,r:1}],
    gamma: [{c:18,r:17},{c:18,r:15},{c:14,r:15},{c:14,r:17}],
    delta: [{c:1,r:17},{c:1,r:15},{c:5,r:15},{c:5,r:17}]
};

function getEnemyNameKey(enemy) {
    if (enemy === enemyAlpha) return 'alpha';
    if (enemy === enemyBeta) return 'beta';
    if (enemy === enemyGamma) return 'gamma';
    return 'delta';
}

function getScatterPatrolTarget(enemy) {
    const key = getEnemyNameKey(enemy);
    const patrol = SCATTER_PATROLS[key];
    if (enemy._scatterIndex == null) enemy._scatterIndex = 0;

    let target = nearestWalkableTarget(patrol[enemy._scatterIndex].c, patrol[enemy._scatterIndex].r);
    const ec = Math.round(enemy.x / TILE_SIZE);
    const er = Math.round(enemy.y / TILE_SIZE);

    // Al acercarse al punto actual, avanza al siguiente. Así nunca se queda "picado" en la esquina.
    if (getTileDistance(ec, er, target.c, target.r) <= 1) {
        enemy._scatterIndex = (enemy._scatterIndex + 1) % patrol.length;
        target = nearestWalkableTarget(patrol[enemy._scatterIndex].c, patrol[enemy._scatterIndex].r);
    }
    return target;
}

function getDynamicFleeTarget(enemy, pCol, pRow) {
    const ec = Math.round(enemy.x / TILE_SIZE);
    const er = Math.round(enemy.y / TILE_SIZE);
    const candidates = [];

    // Busca un destino caminable que esté lejos del jugador y que obligue al enemigo a seguir moviéndose.
    for (let r = 1; r < ROWS - 1; r++) {
        for (let c = 1; c < COLS - 1; c++) {
            if (getMapTile(c, r) === 1) continue;
            const fromPlayer = getTileDistance(c, r, pCol, pRow);
            const fromEnemy = getTileDistance(c, r, ec, er);
            if (fromEnemy < 3) continue;
            candidates.push({ c, r, score: fromPlayer * 3 + fromEnemy * 0.25 });
        }
    }

    if (candidates.length === 0) return nearestWalkableTarget(1, 1);
    candidates.sort((a, b) => b.score - a.score);
    return { c: candidates[0].c, r: candidates[0].r };
}

function updateEnemies() {
    if (!enemyBeta.active && dotsEatenThisLife >= enemyBeta.releaseDots) releaseEnemy(enemyBeta);
    if (!enemyGamma.active && dotsEatenThisLife >= enemyGamma.releaseDots) releaseEnemy(enemyGamma);
    if (!enemyDelta.active && dotsEatenThisLife >= enemyDelta.releaseDots) releaseEnemy(enemyDelta);

    modeTimer++;
    if (enemyMode === 'FRIGHTENED' && modeTimer > FRIGHTENED_DURATION) {
        enemyMode = modeBeforeFrightened;
        modeTimer = 0;
        enemiesEatenThisPowerup = 0;
        setLivingEnemiesState(enemyMode);
    } else if (enemyMode === 'CHASE' && modeTimer > CHASE_DURATION) {
        enemyMode = 'SCATTER';
        modeTimer = 0;
        setLivingEnemiesState('SCATTER');
    } else if (enemyMode === 'SCATTER' && modeTimer > SCATTER_DURATION) {
        enemyMode = 'CHASE';
        modeTimer = 0;
        setLivingEnemiesState('CHASE');
    }

    const pCol = Math.floor(player.x / TILE_SIZE), pRow = Math.floor(player.y / TILE_SIZE);
    const aCol = Math.floor(enemyAlpha.x / TILE_SIZE), aRow = Math.floor(enemyAlpha.y / TILE_SIZE);
    const pDir = player.currentDir !== 'NONE' ? player.currentDir : 'UP';

    // Objetivos fijos de SCATTER. Cada agente tiene su propia zona del mapa.
    const scatterTargets = {
        alpha: { c: COLS - 2, r: 1 },
        beta:  { c: 1, r: 1 },
        gamma: { c: COLS - 2, r: ROWS - 2 },
        delta: { c: 1, r: ROWS - 2 }
    };

    // Devuelve la esquina accesible más alejada del jugador. Se usa para huir de verdad,
    // en lugar de mandar al enemigo a una esquina fija que a veces queda cerca del jugador.
    function farthestScatterTarget() {
        const candidates = Object.values(scatterTargets).map(t => nearestWalkableTarget(t.c, t.r));
        let best = candidates[0];
        let bestDistance = -1;
        for (const candidate of candidates) {
            const d = getTileDistance(candidate.c, candidate.r, pCol, pRow);
            if (d > bestDistance) {
                bestDistance = d;
                best = candidate;
            }
        }
        return { c: best.c, r: best.r };
    }

    // Las cuatro IA tienen comportamientos claramente distintos.
    if (enemyMode === 'FRIGHTENED') {
        for (const e of enemiesList) {
            if (e.active && e.state !== 'RETURN' && e.state !== 'SPAWN') e.state = 'FRIGHTENED';
        }

        // En FRIGHTENED todos intentan alejarse del jugador, pero no comparten exactamente
        // el mismo objetivo: se distribuyen entre esquinas lejanas para no amontonarse.
        const corners = [scatterTargets.alpha, scatterTargets.beta, scatterTargets.gamma, scatterTargets.delta]
            .map(t => nearestWalkableTarget(t.c, t.r))
            .sort((a, b) => getTileDistance(b.c, b.r, pCol, pRow) - getTileDistance(a.c, a.r, pCol, pRow));
        // Si alguno alcanza su rincón, vuelve a buscar un destino lejano para seguir huyendo.
        currentTargets.alpha = getTileDistance(Math.round(enemyAlpha.x/TILE_SIZE), Math.round(enemyAlpha.y/TILE_SIZE), corners[0].c, corners[0].r) <= 1
            ? getDynamicFleeTarget(enemyAlpha, pCol, pRow) : { ...corners[0] };
        currentTargets.beta = getTileDistance(Math.round(enemyBeta.x/TILE_SIZE), Math.round(enemyBeta.y/TILE_SIZE), corners[1].c, corners[1].r) <= 1
            ? getDynamicFleeTarget(enemyBeta, pCol, pRow) : { ...corners[1] };
        currentTargets.gamma = getTileDistance(Math.round(enemyGamma.x/TILE_SIZE), Math.round(enemyGamma.y/TILE_SIZE), corners[2].c, corners[2].r) <= 1
            ? getDynamicFleeTarget(enemyGamma, pCol, pRow) : { ...corners[2] };
        currentTargets.delta = getTileDistance(Math.round(enemyDelta.x/TILE_SIZE), Math.round(enemyDelta.y/TILE_SIZE), corners[3].c, corners[3].r) <= 1
            ? getDynamicFleeTarget(enemyDelta, pCol, pRow) : { ...corners[3] };

    } else if (enemyMode === 'SCATTER') {
        // Patrullan su propia zona en lugar de quedarse inmóviles al llegar a una esquina.
        currentTargets.alpha = getScatterPatrolTarget(enemyAlpha);
        currentTargets.beta  = getScatterPatrolTarget(enemyBeta);
        currentTargets.gamma = getScatterPatrolTarget(enemyGamma);
        currentTargets.delta = getScatterPatrolTarget(enemyDelta);

    } else {
        // ALPHA: cazador directo. Siempre busca el Tile actual del jugador.
        currentTargets.alpha = { c: pCol, r: pRow };

        // BETA: emboscador. Busca una posición varios Tiles delante del jugador.
        // Si el objetivo cae fuera del mapa o sobre un muro, nearestWalkableTarget lo corrige.
        const betaLookAhead = Math.min(7, 4 + Math.floor((currentLevel - 1) / 2));
        currentTargets.beta = nearestWalkableTarget(
            pCol + DIRS[pDir].dx * betaLookAhead,
            pRow + DIRS[pDir].dy * betaLookAhead
        );

        // GAMMA: coordinación. Calcula un punto delante del jugador y lo proyecta usando
        // simultáneamente la posición de Alpha. Esto hace que intente cerrar rutas.
        const pivotDistance = Math.min(4, 2 + Math.floor((currentLevel - 1) / 3));
        const pivotCol = pCol + DIRS[pDir].dx * pivotDistance;
        const pivotRow = pRow + DIRS[pDir].dy * pivotDistance;
        currentTargets.gamma = nearestWalkableTarget(
            pivotCol + (pivotCol - aCol),
            pivotRow + (pivotRow - aRow)
        );

        // DELTA: comportamiento condicional. De lejos persigue al jugador; cuando entra
        // en su radio de seguridad, cambia a la zona accesible más alejada del jugador.
        const deltaCol = Math.floor(enemyDelta.x / TILE_SIZE);
        const deltaRow = Math.floor(enemyDelta.y / TILE_SIZE);
        const deltaDist = getTileDistance(deltaCol, deltaRow, pCol, pRow);
        const retreatDistance = Math.max(5, 8 - Math.floor((currentLevel - 1) / 2));
        currentTargets.delta = deltaDist > retreatDistance
            ? { c: pCol, r: pRow }
            : getDynamicFleeTarget(enemyDelta, pCol, pRow);
    }

    // Nunca hacemos wrap (%) con los objetivos de IA. Un objetivo que sale del mapa se
    // limita al borde y después se ajusta al Tile caminable más cercano. Esto evita que
    // Beta/Gamma parezcan teletransportar su objetivo al lado contrario del laberinto.
    for (const t in currentTargets) {
        const clampedCol = Math.max(0, Math.min(COLS - 1, currentTargets[t].c));
        const clampedRow = Math.max(0, Math.min(ROWS - 1, currentTargets[t].r));
        currentTargets[t] = nearestWalkableTarget(clampedCol, clampedRow);
    }

    enemiesList.forEach(e => {
        if (!e.active) { updateInactiveEnemy(e); return; }

        if (e.state === 'RETURN') e.isDead = true;
        const normalSpeed = e.baseSpeed || 2;
        const frightenedSpeed = Math.max(1, normalSpeed * 0.58);
        const targetSpeed = e.state === 'RETURN' ? Math.max(3.5, normalSpeed + 1.4) : (e.state === 'FRIGHTENED' ? frightenedSpeed : normalSpeed);
        e.speed = targetSpeed;

        let eCol = Math.floor((e.x + TILE_SIZE/2) / TILE_SIZE);
        let eRow = Math.floor((e.y + TILE_SIZE/2) / TILE_SIZE);
        const inBase = eCol >= 8 && eCol <= 11 && eRow >= 7 && eRow <= 9;

        if (e.state === 'RETURN' && inBase) {
            e.state = 'SPAWN';
            e.isDead = false;
            e.spawnTimer = 45;
            e.x = 9 * TILE_SIZE;
            e.y = 8 * TILE_SIZE;
            e.currentDir = 'UP';
            resetEnemyNavigation(e);
        }

        if (e.state === 'SPAWN') {
            if (e.spawnTimer > 0) e.spawnTimer--;
            const exitTarget = { c: 9, r: 6 };
            getEnemyMove(e, exitTarget.c, exitTarget.r);
            eCol = Math.floor(e.x / TILE_SIZE);
            eRow = Math.floor(e.y / TILE_SIZE);
            if (e.spawnTimer <= 0 && !(eCol >= 8 && eCol <= 11 && eRow >= 7 && eRow <= 9)) {
                e.state = enemyMode === 'FRIGHTENED' ? modeBeforeFrightened : enemyMode;
            }
            return;
        }

        let target;
        if (e.state === 'RETURN') target = { c: 9, r: 8 };
        else if (e === enemyAlpha) target = currentTargets.alpha;
        else if (e === enemyBeta) target = currentTargets.beta;
        else if (e === enemyGamma) target = currentTargets.gamma;
        else target = currentTargets.delta;

        getEnemyMove(e, target.c, target.r);
    });
}

function checkCollisions() {
    for (let dot of dots) {
        if (!dot.collected && getDistance(player.x + TILE_SIZE/2, player.y + TILE_SIZE/2, dot.x, dot.y) < 10) {
            dot.collected = true; dotsRemaining--; dotsEatenThisLife++;
            if (dot.isPowerUp) {
                score += 50;
                if (enemyMode !== 'FRIGHTENED') modeBeforeFrightened = enemyMode;
                enemyMode = 'FRIGHTENED';
                modeTimer = 0;
                enemiesEatenThisPowerup = 0;
                enemiesList.forEach(e => {
                    if (e.active && e.state !== 'RETURN' && e.state !== 'SPAWN') e.state = 'FRIGHTENED';
                });
            } else { score += 10; }
        }
    }
    if (dotsRemaining <= 0) { gameState = 'VICTORY'; debugPanel.style.display = 'none'; }

    for (let enemy of enemiesList) {
        if (enemy.active && !enemy.isDead && getDistance(player.x, player.y, enemy.x, enemy.y) < TILE_SIZE - 8) {
            if (enemy.state === 'FRIGHTENED') {
                let comboPoints = 200 * Math.pow(2, enemiesEatenThisPowerup);
                score += comboPoints;
                floatingTexts.push({ x: enemy.x, y: enemy.y, text: `+${comboPoints}`, timer: 60 });
                enemiesEatenThisPowerup++;
                enemy.isDead = true;
                enemy.state = 'RETURN';
                enemy.currentDir = OPPOSITE_DIR[enemy.currentDir] !== 'NONE' ? OPPOSITE_DIR[enemy.currentDir] : 'UP';
                resetEnemyNavigation(enemy); 
            } else {
                gameState = 'DYING'; deathTimer = 60; break; 
            }
        }
    }

    if (portalCooldown <= 0) {
        let pCol = Math.floor((player.x + TILE_SIZE/2) / TILE_SIZE);
        let pRow = Math.floor((player.y + TILE_SIZE/2) / TILE_SIZE);
        
        if (pRow >= 0 && pRow < ROWS && pCol >= 0 && pCol < COLS && mapMatrix[pRow][pCol] === 3) {
            let portals = [];
            for(let r = 0; r < ROWS; r++) {
                for(let c = 0; c < COLS; c++) {
                    if (mapMatrix[r][c] === 3 && (r !== pRow || c !== pCol)) { portals.push({r, c}); }
                }
            }
            if (portals.length > 0) {
                let dest = portals[Math.floor(Math.random() * portals.length)];
                player.x = dest.c * TILE_SIZE; player.y = dest.r * TILE_SIZE; portalCooldown = 60; 
            }
        }
    }
}

function submitScoreAuto() {
    if (scoreSubmitted) return;
    scoreSubmitted = true;
    fetch('http://localhost:3000/api/scores', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'PLAYER', score: score })
    }).catch(() => {});
}

function update() { 
    if (portalCooldown > 0) portalCooldown--;

    if (gameState === 'READY') {
        readyTimer--;
        if (readyTimer <= 0) gameState = 'PLAYING';
    } else if (gameState === 'PLAYING') { 
        updatePlayer(); updateEnemies(); checkCollisions(); 
    } else if (gameState === 'DYING') {
        deathTimer--;
        player.size = Math.max(0, player.size - 0.5);
        if (deathTimer <= 0) loseLife();
    }
}

function drawMap() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (mapMatrix[row][col] === 1) {
                ctx.fillStyle = '#0033cc'; ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#00aaff'; ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (mapMatrix[row][col] === 2 && gameState === 'EDITOR') {
                ctx.fillStyle = '#ffff00'; ctx.beginPath(); ctx.arc(col * TILE_SIZE + TILE_SIZE/2, row * TILE_SIZE + TILE_SIZE/2, 8, 0, Math.PI * 2); ctx.fill(); 
            } else if (mapMatrix[row][col] === 3) {
                ctx.fillStyle = '#00ffff'; ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 15;
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.shadowBlur = 0;
            }
            if (gameState === 'EDITOR') {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'; ctx.strokeRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
    if (gameState !== 'EDITOR') {
        ctx.fillStyle = 'rgba(255, 100, 255, 0.5)';
        ctx.fillRect(9 * TILE_SIZE, 7 * TILE_SIZE, TILE_SIZE * 2, TILE_SIZE / 4);
    }
}

function drawDots() {
    if (gameState === 'EDITOR') return; 
    for (let dot of dots) {
        if (!dot.collected) {
            ctx.fillStyle = (dot.isPowerUp && Math.floor(Date.now() / 300) % 2 === 0) ? '#ffff00' : '#ffffff';
            ctx.beginPath(); ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2); ctx.fill(); 
        }
    }
}

// NUEVO: Función refactorizada que maneja tanto Sprite Sheets reales como dibujos vectoriales animados si no hay imagen
function drawEntity(entity, isPlayer) {
    if (gameState === 'EDITOR') return;
    
    let animFrame = Math.floor(Date.now() / 150) % 2; 
    // Tamaño seguro para cualquier entidad. Los enemigos antes no tenían 'size',
    // lo que hacía que drawImage recibiera NaN y por eso no se dibujaran.
    const drawSize = entity.size ?? (TILE_SIZE - 4);

    if (spriteSheet.complete && spriteSheet.naturalWidth > 0) {
        // Lógica oficial para Sprite Sheets (Cumplimiento de rúbrica)
        let row = 0, col = 0;
        
        if (isPlayer) {
            row = 0;
            if (player.currentDir === 'RIGHT') col = 0;
            else if (player.currentDir === 'LEFT') col = 2;
            else if (player.currentDir === 'UP') col = 4;
            else col = 6;
            col += animFrame;
        } else {
            if (entity.state === 'RETURN' || entity.isDead) {
                row = 6; // Fila de ojos / RETURN
                if (entity.currentDir === 'RIGHT') col = 0;
                else if (entity.currentDir === 'LEFT') col = 1;
                else if (entity.currentDir === 'UP') col = 2;
                else col = 3;
            } else if (entity.state === 'FRIGHTENED') {
                row = 5; // Fila asustados
                col = (modeTimer > FRIGHTENED_DURATION - 120 && animFrame === 1) ? 2 : animFrame;
            } else {
                row = entity.type + 1; // Filas 1 a 4 según color de fantasma
                if (entity.currentDir === 'RIGHT') col = 0;
                else if (entity.currentDir === 'LEFT') col = 2;
                else if (entity.currentDir === 'UP') col = 4;
                else col = 6;
                col += animFrame;
            }
        }
        
        ctx.save();
        if (isPlayer && gameState === 'DYING') {
            ctx.translate(entity.x + TILE_SIZE/2, entity.y + TILE_SIZE/2);
            ctx.rotate(deathTimer * 0.5);
            ctx.drawImage(spriteSheet, col * 32, row * 32, 32, 32, -drawSize/2, -drawSize/2, drawSize, drawSize);
        } else {
            ctx.drawImage(spriteSheet, col * 32, row * 32, 32, 32, entity.x + (32 - drawSize)/2, entity.y + (32 - drawSize)/2, drawSize, drawSize);
        }
        ctx.restore();

    } else {
        // FALLBACK VECTORIAL ANIMADO: Si no tienes el sprites.png en la carpeta 'img', dibujará formas animadas hermosas en Canvas
        ctx.save();
        ctx.translate(entity.x + TILE_SIZE/2, entity.y + TILE_SIZE/2);
        
        if (isPlayer) {
            if (gameState === 'DYING') ctx.rotate(deathTimer * 0.5);
            let angleOffset = 0;
            if (entity.currentDir === 'DOWN') angleOffset = Math.PI / 2;
            else if (entity.currentDir === 'LEFT') angleOffset = Math.PI;
            else if (entity.currentDir === 'UP') angleOffset = -Math.PI / 2;
            
            ctx.rotate(angleOffset);
            let mouthOpen = (animFrame === 0 && entity.currentDir !== 'NONE') ? 0.25 : 0.05;
            
            ctx.fillStyle = entity.color;
            ctx.beginPath();
            ctx.arc(0, 0, drawSize/2, mouthOpen * Math.PI, (2 - mouthOpen) * Math.PI);
            ctx.lineTo(0, 0);
            ctx.fill();
        } else {
            if (entity.isDead) {
                // Solo Ojos
                ctx.fillStyle = 'white';
                ctx.beginPath(); ctx.arc(-6, -4, 4, 0, Math.PI*2); ctx.arc(6, -4, 4, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = 'blue';
                let eyeOffset = entity.currentDir === 'RIGHT' ? 2 : entity.currentDir === 'LEFT' ? -2 : 0;
                let eyeOffsetY = entity.currentDir === 'DOWN' ? 2 : entity.currentDir === 'UP' ? -2 : 0;
                ctx.beginPath(); ctx.arc(-6 + eyeOffset, -4 + eyeOffsetY, 2, 0, Math.PI*2); ctx.arc(6 + eyeOffset, -4 + eyeOffsetY, 2, 0, Math.PI*2); ctx.fill();
            } else {
                ctx.fillStyle = (entity.state === 'FRIGHTENED') ? ((modeTimer > FRIGHTENED_DURATION - 120 && animFrame === 1) ? '#ffffff' : '#0033ff') : entity.color;
                
                // Cuerpo ondulado del fantasma
                ctx.beginPath();
                let r = drawSize/2;
                ctx.arc(0, -2, r, Math.PI, 0);
                ctx.lineTo(r, r);
                
                // Falda ondulada animada
                let waveCount = 3;
                let waveWidth = (r * 2) / waveCount;
                let wavePhase = animFrame === 0 ? 0 : 2;
                for (let i = waveCount; i > 0; i--) {
                    ctx.quadraticCurveTo(r - (waveWidth * i) + (waveWidth / 2), r - 4 + wavePhase, r - (waveWidth * i), r);
                }
                
                ctx.lineTo(-r, r);
                ctx.fill();

                // Ojos
                ctx.fillStyle = (entity.state === 'FRIGHTENED') ? '#ffaaff' : 'white';
                ctx.beginPath(); ctx.arc(-6, -4, 4, 0, Math.PI*2); ctx.arc(6, -4, 4, 0, Math.PI*2); ctx.fill();
                
                ctx.fillStyle = (entity.state === 'FRIGHTENED') ? '#ff0000' : 'blue';
                let eyeOffset = entity.currentDir === 'RIGHT' ? 2 : entity.currentDir === 'LEFT' ? -2 : 0;
                let eyeOffsetY = entity.currentDir === 'DOWN' ? 2 : entity.currentDir === 'UP' ? -2 : 0;
                ctx.beginPath(); ctx.arc(-6 + eyeOffset, -4 + eyeOffsetY, 2, 0, Math.PI*2); ctx.arc(6 + eyeOffset, -4 + eyeOffsetY, 2, 0, Math.PI*2); ctx.fill();
            }
        }
        ctx.restore();
    }
}

function drawDebug() {
    if (!debugMode || (gameState !== 'PLAYING' && gameState !== 'READY' && gameState !== 'DYING')) {
        debugPanel.style.display = 'none';
        return;
    }

    ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 1;
    ctx.strokeRect(player.x, player.y, TILE_SIZE, TILE_SIZE);
    
    enemiesList.forEach(e => {
        if (e.active) {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(e.x, e.y, TILE_SIZE, TILE_SIZE);
        }
    });

    const drawTargetLine = (enemy, target, color) => {
        if (!enemy.active || !target) return;
        ctx.beginPath();
        ctx.moveTo(enemy.x + TILE_SIZE/2, enemy.y + TILE_SIZE/2);
        ctx.lineTo(target.c * TILE_SIZE + TILE_SIZE/2, target.r * TILE_SIZE + TILE_SIZE/2);
        ctx.strokeStyle = color;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeRect(target.c * TILE_SIZE, target.r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    };

    drawTargetLine(enemyAlpha, currentTargets.alpha, '#ff0044');
    drawTargetLine(enemyBeta, currentTargets.beta, '#ffb8ff');   
    drawTargetLine(enemyGamma, currentTargets.gamma, '#00aaff'); 
    drawTargetLine(enemyDelta, currentTargets.delta, '#ffaa00'); 

    const drawPath = (path, color) => {
        if (!path || path.length === 0) return;
        ctx.beginPath();
        path.forEach((node, index) => {
            const x = node.c * TILE_SIZE + TILE_SIZE/2;
            const y = node.r * TILE_SIZE + TILE_SIZE/2;
            if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.globalAlpha = 1;
    };
    drawPath(currentPaths.alpha, '#ff0044');
    drawPath(currentPaths.beta, '#ffb8ff');
    drawPath(currentPaths.gamma, '#00aaff');
    drawPath(currentPaths.delta, '#ffaa00');

    debugPanel.style.display = 'block';
    debugPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #fff; text-align: center;">MODO DEBUG</div>
        <hr style="border-color: #00ffcc;">
        <br>
        FPS: ${currentFps}<br><br>
        NIVEL: ${currentLevel}<br><br>
        JUGADOR: [${Math.floor(player.x/TILE_SIZE)}, ${Math.floor(player.y/TILE_SIZE)}]<br><br>
        MODO GLOBAL: ${enemyMode}<br><br>
        PUNTOS RES: ${dotsRemaining}<br><br>
        <span style="color:#ff0044">ALPHA: ${enemyAlpha.active ? enemyAlpha.state : 'INACT'} | DIST: ${getTileDistance(Math.floor(enemyAlpha.x/TILE_SIZE), Math.floor(enemyAlpha.y/TILE_SIZE), Math.floor(player.x/TILE_SIZE), Math.floor(player.y/TILE_SIZE)).toFixed(1)} tiles</span><br><br>
        <span style="color:#ffb8ff">BETA: ${enemyBeta.active ? enemyBeta.state : 'INACT'} | DIST: ${getTileDistance(Math.floor(enemyBeta.x/TILE_SIZE), Math.floor(enemyBeta.y/TILE_SIZE), Math.floor(player.x/TILE_SIZE), Math.floor(player.y/TILE_SIZE)).toFixed(1)} tiles</span><br><br>
        <span style="color:#00aaff">GAMMA: ${enemyGamma.active ? enemyGamma.state : 'INACT'} | DIST: ${getTileDistance(Math.floor(enemyGamma.x/TILE_SIZE), Math.floor(enemyGamma.y/TILE_SIZE), Math.floor(player.x/TILE_SIZE), Math.floor(player.y/TILE_SIZE)).toFixed(1)} tiles</span><br><br>
        <span style="color:#ffaa00">DELTA: ${enemyDelta.active ? enemyDelta.state : 'INACT'} | DIST: ${getTileDistance(Math.floor(enemyDelta.x/TILE_SIZE), Math.floor(enemyDelta.y/TILE_SIZE), Math.floor(player.x/TILE_SIZE), Math.floor(player.y/TILE_SIZE)).toFixed(1)} tiles</span>
    `;
}

function drawUI() { 
    if (gameState === 'EDITOR') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, 30);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('MODO EDITOR | CLIC: Cambiar | S: Guardar JSON | ESC: Salir', 10, 20);
        return;
    }

    ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 20px Courier New'; ctx.textAlign = 'left'; ctx.fillText('SCORE: ' + score, 10, 25); 
    ctx.fillStyle = player.color; ctx.textAlign = 'center'; ctx.fillText('VIDAS: ' + lives + '   NIVEL: ' + currentLevel, canvas.width / 2, 25); 
    ctx.fillStyle = (enemyMode === 'FRIGHTENED') ? '#ffff00' : '#8888aa'; ctx.textAlign = 'right'; ctx.fillText('RADAR: ' + enemyMode, canvas.width - 10, 25);

    if (gameState === 'READY') {
        ctx.fillStyle = '#ffff00'; ctx.font = 'bold 35px Courier New'; ctx.textAlign = 'center';
        ctx.fillText('¡READY!', canvas.width / 2, 11.5 * TILE_SIZE);
    }
}

function drawMenus() {
    if (gameState === 'TITLE') {
        ctx.fillStyle = 'rgba(0, 0, 0, 1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 60px Courier New'; ctx.textAlign = 'center'; 
        ctx.fillText('CYBER MAZE', canvas.width / 2, canvas.height / 2 - 40);
        ctx.fillStyle = '#ff00ff'; ctx.font = '20px Courier New'; 
        ctx.fillText('PURSUIT PROTOCOL', canvas.width / 2, canvas.height / 2);

        if (Math.floor(Date.now() / 500) % 2 === 0) {
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px Courier New';
            ctx.fillText('- PRESIONA ENTER PARA INICIAR -', canvas.width / 2, canvas.height / 2 + 80);
        }
    } else if (gameState === 'START') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 40px Courier New'; ctx.textAlign = 'center'; ctx.fillText('MENÚ PRINCIPAL', canvas.width / 2, 80);
        
        ctx.font = 'bold 22px Courier New';
        for (let i = 0; i < mainOptions.length; i++) {
            ctx.fillStyle = i === mainMenuIndex ? '#ff00ff' : '#ffffff';
            ctx.fillText((i === mainMenuIndex ? '> ' : '') + mainOptions[i] + (i === mainMenuIndex ? ' <' : ''), canvas.width / 2, 150 + (i * 45));
        }
    } else if (gameState === 'MENU_INSTRUCTIONS') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 35px Courier New'; ctx.textAlign = 'center'; ctx.fillText('INSTRUCCIONES', canvas.width / 2, 70);
        
        ctx.fillStyle = '#ffffff'; ctx.font = '18px Courier New'; ctx.textAlign = 'left';
        ctx.fillText('• Usa las FLECHAS DIRECCIONALES para moverte.', 40, 130);
        ctx.fillText('• Come todos los puntos blancos para ganar.', 40, 170);
        ctx.fillText('• Evita a los enemigos; si te tocan, pierdes vida.', 40, 210);
        
        ctx.fillStyle = '#ffff00';
        ctx.fillText('• POWER-UPS (Puntos grandes amarillos):', 40, 260);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('  Te permiten comerte a los enemigos temporalmente.', 40, 290);
        ctx.fillText('  ¡Encadena combos para multiplicar tus puntos!', 40, 320);

        ctx.fillStyle = '#00ffff';
        ctx.fillText('• PORTALES (Casillas celestes):', 40, 370);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('  Atraviésalos para teletransportarte por el mapa.', 40, 400);

        ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 16px Courier New'; ctx.textAlign = 'center';
        ctx.fillText('Presiona ESC o ENTER para volver', canvas.width / 2, canvas.height - 40);
    } else if (gameState === 'MENU_CREDITS') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 35px Courier New'; ctx.textAlign = 'center'; ctx.fillText('CRÉDITOS', canvas.width / 2, 100);
        
        ctx.fillStyle = '#ffffff'; ctx.font = '22px Courier New';
        ctx.fillText('DESARROLLADO POR:', canvas.width / 2, 200);
        
        ctx.fillStyle = '#ff00ff'; ctx.font = 'bold 26px Courier New';
        ctx.fillText('Iris Mairet Lucho Hernandez', canvas.width / 2, 260);
        ctx.fillText('Pamela Ameli Aguirre Sanchez', canvas.width / 2, 310);
        
        ctx.fillStyle = '#8888aa'; ctx.font = '16px Courier New';
        ctx.fillText('Proyecto 4: Cyber Maze - Pursuit Protocol', canvas.width / 2, 400);

        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 16px Courier New';
        ctx.fillText('Presiona ESC o ENTER para volver', canvas.width / 2, canvas.height - 40);
    } else if (gameState === 'MENU_LEVELS') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 30px Courier New'; ctx.textAlign = 'center'; ctx.fillText('NIVELES GUARDADOS', canvas.width / 2, 70);
        
        ctx.font = '18px Courier New';
        if (savedLevels.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText('No hay niveles guardados aún.', canvas.width / 2, canvas.height / 2);
        } else {
            let start = Math.max(0, levelMenuIndex - 5);
            let end = Math.min(savedLevels.length, start + 10);
            for (let i = start; i < end; i++) {
                ctx.fillStyle = i === levelMenuIndex ? '#ffff00' : '#ffffff';
                let levelName = savedLevels[i].name || `Nivel ${i + 1}`;
                ctx.fillText((i === levelMenuIndex ? '> ' : '') + levelName + (i === levelMenuIndex ? ' <' : ''), canvas.width / 2, 120 + ((i - start) * 25));
            }
        }
        ctx.fillStyle = '#ff00ff'; ctx.font = '14px Courier New';
        ctx.fillText('FLECHAS: Mover | ENTER: Jugar | ESC: Volver', canvas.width / 2, canvas.height - 40);
    } else if (gameState === 'MENU_SCORES') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 30px Courier New'; ctx.textAlign = 'center'; ctx.fillText('MEJORES PUNTUACIONES', canvas.width / 2, 70);
        
        ctx.font = '18px Courier New';
        if (highScores.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText('No hay registros aún o sin conexión', canvas.width / 2, canvas.height / 2);
        } else {
            highScores.forEach((item, index) => {
                ctx.fillStyle = index === 0 ? '#ffff00' : '#ffffff';
                ctx.fillText(`${index + 1}. ${item.name.padEnd(10, ' ')} - ${item.score}`, canvas.width / 2, 120 + (index * 25));
            });
        }
        ctx.fillStyle = '#ff00ff'; ctx.font = '14px Courier New';
        ctx.fillText('Presiona ESC o ENTER para volver', canvas.width / 2, canvas.height - 40);
    } else if (gameState === 'ENTER_NAME') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0044'; ctx.font = 'bold 40px Courier New'; ctx.textAlign = 'center'; ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 60);
        ctx.fillStyle = '#ffffff'; ctx.font = '18px Courier New'; ctx.fillText('Ingresa tus iniciales (Máx 10):', canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 30px Courier New';
        ctx.fillText(playerName + '_', canvas.width / 2, canvas.height / 2 + 40);
        
        ctx.fillStyle = '#8888aa'; ctx.font = '14px Courier New';
        ctx.fillText('Presiona ENTER para guardar', canvas.width / 2, canvas.height / 2 + 90);
    } else if (gameState === 'PAUSED') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 40px Courier New'; ctx.textAlign = 'center'; ctx.fillText('PAUSA', canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = 'bold 24px Courier New';
        for (let i = 0; i < pauseOptions.length; i++) {
            ctx.fillStyle = i === pauseMenuIndex ? '#ff00ff' : '#ffffff';
            ctx.fillText((i === pauseMenuIndex ? '> ' : '') + pauseOptions[i] + (i === pauseMenuIndex ? ' <' : ''), canvas.width / 2, canvas.height / 2 + (i * 50));
        }
    } else if (gameState === 'GAMEOVER') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff0044'; ctx.font = 'bold 50px Courier New'; ctx.textAlign = 'center'; ctx.fillText('REGISTRADO', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#ffffff'; ctx.font = '20px Courier New'; ctx.fillText('PUNTUACIÓN: ' + score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillStyle = '#00ffcc'; ctx.font = '18px Courier New'; ctx.fillText('Presiona ENTER para ir al menú', canvas.width / 2, canvas.height / 2 + 70);
    } else if (gameState === 'VICTORY') {
        ctx.fillStyle = 'rgba(0, 255, 204, 0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 50px Courier New'; ctx.textAlign = 'center'; ctx.fillText('NIVEL ' + currentLevel + ' COMPLETADO', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#ffffff'; ctx.font = '20px Courier New'; ctx.fillText('PUNTUACIÓN: ' + score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillStyle = '#ff00ff'; ctx.font = '18px Courier New'; ctx.fillText('ENTER: siguiente nivel (más difícil)', canvas.width / 2, canvas.height / 2 + 70);
    }
}

function gameLoop(timestamp) {
    if (!timestamp) timestamp = performance.now();
    frameCount++;
    if (timestamp - lastFpsUpdate >= 1000) {
        currentFps = frameCount;
        frameCount = 0;
        lastFpsUpdate = timestamp;
    }

    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gameState !== 'EDITOR' && gameState !== 'TITLE' && gameState !== 'MENU_INSTRUCTIONS' && gameState !== 'MENU_CREDITS') update(); 
    
    if (gameState !== 'TITLE' && gameState !== 'MENU_INSTRUCTIONS' && gameState !== 'MENU_CREDITS') {
        drawMap(); 
        drawDots();
    }
    
    if (gameState === 'READY' || gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'DYING') { 
        drawEntity(player, true); 
        drawEntity(enemyAlpha, false); 
        drawEntity(enemyBeta, false); 
        drawEntity(enemyGamma, false); 
        drawEntity(enemyDelta, false); 
        
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            let ft = floatingTexts[i];
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 20px Courier New';
            ctx.fillText(ft.text, ft.x, ft.y);
            ft.y -= 1; 
            ft.timer--; 
            if (ft.timer <= 0) floatingTexts.splice(i, 1);
        }
    }
    
    drawDebug();
    if (gameState !== 'START' && gameState !== 'MENU_SCORES' && gameState !== 'MENU_LEVELS' && gameState !== 'TITLE' && gameState !== 'MENU_INSTRUCTIONS' && gameState !== 'MENU_CREDITS') drawUI(); 
    drawMenus(); 
    
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);