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
    debugPanel.style.minWidth = '220px';
    debugPanel.style.boxShadow = '0 0 15px rgba(0, 255, 204, 0.3)';

    wrapper.appendChild(debugPanel);
}

const TILE_SIZE = 32;
const COLS = 20;
const ROWS = 20;

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

let mapMatrix = JSON.parse(JSON.stringify(BASE_MAP));

// NUEVO: Estado inicial para la Pantalla de Inicio
let gameState = 'TITLE'; 
let readyTimer = 0;
let deathTimer = 0;

let debugMode = false;
let currentFps = 0;
let frameCount = 0;
let lastFpsUpdate = 0;
let currentTargets = { alpha: null, beta: null, gamma: null, delta: null };

let mainMenuIndex = 0;
// NUEVO: Opciones añadidas al menú
const mainOptions = ['Jugar (Mapa Base)', 'Niveles Guardados', 'Ver Récords (Top 10)', 'Editor de Niveles', 'Instrucciones', 'Créditos'];
let pauseMenuIndex = 0;
const pauseOptions = ['Continuar', 'Reiniciar', 'Salir al Menú'];

let playerName = '';
let highScores = [];
let scoreSubmitted = false;
let savedLevels = [];
let levelMenuIndex = 0;

const DIRS = { 'UP': { dx: 0, dy: -1 }, 'DOWN': { dx: 0, dy: 1 }, 'LEFT': { dx: -1, dy: 0 }, 'RIGHT': { dx: 1, dy: 0 }, 'NONE': { dx: 0, dy: 0 } };
const OPPOSITE_DIR = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT', 'NONE': 'NONE' };

let enemyMode = 'CHASE'; 
let modeTimer = 0;
const CHASE_DURATION = 60 * 15;  
const SCATTER_DURATION = 60 * 5; 
const FRIGHTENED_DURATION = 60 * 7; 
let enemiesEatenThisPowerup = 0; 
let floatingTexts = []; 

let player = { x: 9 * TILE_SIZE, y: 3 * TILE_SIZE, speed: 2, currentDir: 'NONE', nextDir: 'NONE', color: '#00ffcc', size: TILE_SIZE - 8 };
let portalCooldown = 0; 

let enemyAlpha = { x: 9 * TILE_SIZE, y: 6 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#ff0044', active: true, isDead: false, releaseDots: 0 };
let enemyBeta = { x: 9 * TILE_SIZE, y: 8 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#ffb8ff', active: false, isDead: false, releaseDots: 20 };
let enemyGamma = { x: 10 * TILE_SIZE, y: 8 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#00aaff', active: false, isDead: false, releaseDots: 50 };
let enemyDelta = { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, speed: 2, currentDir: 'UP', color: '#ffaa00', active: false, isDead: false, releaseDots: 90 };
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

function resetPositions() {
    player.x = 9 * TILE_SIZE; player.y = 3 * TILE_SIZE; 
    player.currentDir = 'NONE'; player.nextDir = 'NONE'; player.size = TILE_SIZE - 8;
    dotsEatenThisLife = 0;
    portalCooldown = 0;
    enemiesEatenThisPowerup = 0;
    floatingTexts = [];

    enemyAlpha.x = 9 * TILE_SIZE; enemyAlpha.y = 6 * TILE_SIZE; enemyAlpha.currentDir = 'UP'; enemyAlpha.active = true; enemyAlpha.isDead = false;
    enemyBeta.active = false; enemyBeta.x = 9 * TILE_SIZE; enemyBeta.y = 8 * TILE_SIZE; enemyBeta.currentDir = 'UP'; enemyBeta.isDead = false;
    enemyGamma.active = false; enemyGamma.x = 10 * TILE_SIZE; enemyGamma.y = 8 * TILE_SIZE; enemyGamma.currentDir = 'UP'; enemyGamma.isDead = false;
    enemyDelta.active = false; enemyDelta.x = 9 * TILE_SIZE; enemyDelta.y = 9 * TILE_SIZE; enemyDelta.currentDir = 'UP'; enemyDelta.isDead = false;
    
    enemyMode = 'CHASE';
    modeTimer = 0;
}

function fullResetGame() {
    score = 0; lives = 3; scoreSubmitted = false; playerName = '';
    initDots(); resetPositions();
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
    if (e.key === 'F2') {
        debugMode = !debugMode;
        e.preventDefault();
        return;
    }

    if (gameState === 'TITLE') {
        if (e.key === 'Enter') {
            gameState = 'START';
        }
        return;
    }

    if (gameState === 'START') {
        if (e.key === 'ArrowUp') mainMenuIndex = mainMenuIndex - 1 < 0 ? mainOptions.length - 1 : mainMenuIndex - 1;
        if (e.key === 'ArrowDown') mainMenuIndex = mainMenuIndex + 1 >= mainOptions.length ? 0 : mainMenuIndex + 1;
        if (e.key === 'Enter') {
            if (mainMenuIndex === 0) { 
                mapMatrix = JSON.parse(JSON.stringify(BASE_MAP)); 
                fullResetGame(); gameState = 'READY'; readyTimer = 120; 
            }
            else if (mainMenuIndex === 1) { fetchLevels(); }
            else if (mainMenuIndex === 2) { fetchScores(); }
            else if (mainMenuIndex === 3) { 
                mapMatrix = JSON.parse(JSON.stringify(BASE_MAP)); 
                gameState = 'EDITOR'; 
            }
            else if (mainMenuIndex === 4) { gameState = 'MENU_INSTRUCTIONS'; }
            else if (mainMenuIndex === 5) { gameState = 'MENU_CREDITS'; }
        }
        return;
    }

    if (gameState === 'MENU_INSTRUCTIONS' || gameState === 'MENU_CREDITS') {
        if (e.key === 'Escape' || e.key === 'Enter') { gameState = 'START'; }
        return;
    }

    if (gameState === 'MENU_LEVELS') {
        if (e.key === 'Escape') { gameState = 'START'; return; }
        if (savedLevels.length > 0) {
            if (e.key === 'ArrowUp') levelMenuIndex = levelMenuIndex - 1 < 0 ? savedLevels.length - 1 : levelMenuIndex - 1;
            if (e.key === 'ArrowDown') levelMenuIndex = levelMenuIndex + 1 >= savedLevels.length ? 0 : levelMenuIndex + 1;
            if (e.key === 'Enter') {
                mapMatrix = JSON.parse(JSON.stringify(savedLevels[levelMenuIndex].matrix));
                fullResetGame(); gameState = 'READY'; readyTimer = 120;
            }
        }
        return;
    }
    
    if (gameState === 'EDITOR') {
        if (e.key === 'Escape') gameState = 'START'; 
        if (e.key.toLowerCase() === 's') {
            const levelName = prompt("Ingresa un nombre para tu nivel:");
            if (levelName) {
                fetch('http://localhost:3000/api/levels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: levelName, matrix: mapMatrix })
                })
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

    if ((gameState === 'GAMEOVER' || gameState === 'VICTORY') && e.key === 'Enter') { 
        gameState = 'START'; return; 
    }

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

function getEnemyMove(enemy, targetCol, targetRow) {
    if (enemy.x % TILE_SIZE === 0 && enemy.y % TILE_SIZE === 0) {
        const col = enemy.x / TILE_SIZE, row = enemy.y / TILE_SIZE;
        let bestDir = enemy.currentDir, minDistance = Infinity, validMoves = [];
        
        for (let dir of ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
            if (dir === OPPOSITE_DIR[enemy.currentDir]) continue; 
            if (enemy.isDead || getMapTile(col + DIRS[dir].dx, row + DIRS[dir].dy) !== 1) {
                validMoves.push(dir);
            }
        }
        
        if (validMoves.length === 0) bestDir = OPPOSITE_DIR[enemy.currentDir];
        else {
            for (let dir of validMoves) {
                let nextCol = col + DIRS[dir].dx;
                if (nextCol < 0) nextCol = COLS - 1;
                if (nextCol >= COLS) nextCol = 0;
                
                let nextRow = row + DIRS[dir].dy;
                let dist = getTileDistance(nextCol, nextRow, targetCol, targetRow);
                
                for (let other of enemiesList) {
                    if (other !== enemy && other.active && Math.floor(other.x/TILE_SIZE) === nextCol && Math.floor(other.y/TILE_SIZE) === nextRow) {
                        dist += 20; 
                    }
                }
                if (dist < minDistance) { minDistance = dist; bestDir = dir; }
            }
        }
        enemy.currentDir = bestDir;
    }
    
    enemy.x += DIRS[enemy.currentDir].dx * enemy.speed; 
    enemy.y += DIRS[enemy.currentDir].dy * enemy.speed;
    
    if (enemy.x < -TILE_SIZE) enemy.x = canvas.width; 
    if (enemy.x > canvas.width) enemy.x = -TILE_SIZE;
}

function updateInactiveEnemy(enemy) {
    if (enemy.x % TILE_SIZE === 0 && enemy.y % TILE_SIZE === 0) {
        let col = Math.floor(enemy.x / TILE_SIZE), row = Math.floor(enemy.y / TILE_SIZE);
        let nextCol = col + DIRS[enemy.currentDir].dx, nextRow = row + DIRS[enemy.currentDir].dy;
        if (nextRow < 8 || nextRow > 9 || nextCol < 8 || nextCol > 11) enemy.currentDir = OPPOSITE_DIR[enemy.currentDir];
    }
    enemy.x += DIRS[enemy.currentDir].dx * 1; enemy.y += DIRS[enemy.currentDir].dy * 1;
}

function updateEnemies() {
    if (!enemyBeta.active && dotsEatenThisLife >= enemyBeta.releaseDots) { enemyBeta.active = true; enemyBeta.x = 9 * TILE_SIZE; enemyBeta.y = 7 * TILE_SIZE; }
    if (!enemyGamma.active && dotsEatenThisLife >= enemyGamma.releaseDots) { enemyGamma.active = true; enemyGamma.x = 9 * TILE_SIZE; enemyGamma.y = 7 * TILE_SIZE; }
    if (!enemyDelta.active && dotsEatenThisLife >= enemyDelta.releaseDots) { enemyDelta.active = true; enemyDelta.x = 9 * TILE_SIZE; enemyDelta.y = 7 * TILE_SIZE; }

    modeTimer++;
    if (enemyMode === 'FRIGHTENED' && modeTimer > FRIGHTENED_DURATION) { enemyMode = 'CHASE'; modeTimer = 0; enemiesEatenThisPowerup = 0; } 
    else if (enemyMode === 'CHASE' && modeTimer > CHASE_DURATION) { enemyMode = 'SCATTER'; modeTimer = 0; } 
    else if (enemyMode === 'SCATTER' && modeTimer > SCATTER_DURATION) { enemyMode = 'CHASE'; modeTimer = 0; }

    let pCol = Math.floor(player.x / TILE_SIZE), pRow = Math.floor(player.y / TILE_SIZE);
    let aCol = Math.floor(enemyAlpha.x / TILE_SIZE), aRow = Math.floor(enemyAlpha.y / TILE_SIZE);
    let currentEnemySpeed = (enemyMode === 'FRIGHTENED') ? 1 : 2;

    if (enemyMode === 'FRIGHTENED') {
        currentTargets.alpha = { c: aCol - (pCol - aCol), r: aRow - (pRow - aRow) };
        currentTargets.beta = { c: Math.floor(enemyBeta.x/TILE_SIZE) - (pCol - Math.floor(enemyBeta.x/TILE_SIZE)), r: Math.floor(enemyBeta.y/TILE_SIZE) - (pRow - Math.floor(enemyBeta.y/TILE_SIZE)) };
        currentTargets.gamma = { c: Math.floor(enemyGamma.x/TILE_SIZE) - (pCol - Math.floor(enemyGamma.x/TILE_SIZE)), r: Math.floor(enemyGamma.y/TILE_SIZE) - (pRow - Math.floor(enemyGamma.y/TILE_SIZE)) };
        currentTargets.delta = { c: Math.floor(enemyDelta.x/TILE_SIZE) - (pCol - Math.floor(enemyDelta.x/TILE_SIZE)), r: Math.floor(enemyDelta.y/TILE_SIZE) - (pRow - Math.floor(enemyDelta.y/TILE_SIZE)) };
    } else if (enemyMode === 'SCATTER') {
        currentTargets.alpha = { c: COLS - 2, r: 1 };         
        currentTargets.beta = { c: 1, r: 1 };          
        currentTargets.gamma = { c: COLS - 2, r: ROWS - 2 };  
        currentTargets.delta = { c: 1, r: ROWS - 2 };  
    } else {
        currentTargets.alpha = { c: pCol, r: pRow };
        let pDir = player.currentDir !== 'NONE' ? player.currentDir : 'UP';
        currentTargets.beta = { c: pCol + (DIRS[pDir].dx * 4), r: pRow + (DIRS[pDir].dy * 4) };
        let pivotCol = pCol + (DIRS[pDir].dx * 2), pivotRow = pRow + (DIRS[pDir].dy * 2);
        currentTargets.gamma = { c: aCol + 2 * (pivotCol - aCol), r: aRow + 2 * (pivotRow - aRow) };
        
        let deltaCol = Math.floor(enemyDelta.x / TILE_SIZE);
        let deltaRow = Math.floor(enemyDelta.y / TILE_SIZE);
        let deltaDist = getTileDistance(deltaCol, deltaRow, pCol, pRow);
        currentTargets.delta = deltaDist > 8 ? { c: pCol, r: pRow } : { c: 1, r: ROWS - 2 };
    }
    
    for (let t in currentTargets) {
        if (currentTargets[t].c < 0) currentTargets[t].c = COLS + (currentTargets[t].c % COLS);
        if (currentTargets[t].c >= COLS) currentTargets[t].c = currentTargets[t].c % COLS;
    }

    enemiesList.forEach(e => {
        if (!e.active) {
            updateInactiveEnemy(e);
            return;
        }
        
        let targetSpeed = e.isDead ? 4 : currentEnemySpeed;
        if (e.speed !== targetSpeed) {
            e.speed = targetSpeed;
            e.x = Math.round(e.x / e.speed) * e.speed;
            e.y = Math.round(e.y / e.speed) * e.speed;
        }

        if (e.isDead) {
            let eCol = Math.floor((e.x + TILE_SIZE/2) / TILE_SIZE);
            let eRow = Math.floor((e.y + TILE_SIZE/2) / TILE_SIZE);
            if (eCol >= 8 && eCol <= 11 && eRow >= 7 && eRow <= 9) {
                e.isDead = false; 
                e.x = 9 * TILE_SIZE;
                e.y = 8 * TILE_SIZE;
                e.speed = currentEnemySpeed; 
            }
        }
        
        let eCol = Math.floor(e.x / TILE_SIZE);
        let eRow = Math.floor(e.y / TILE_SIZE);
        let inBase = (eCol >= 8 && eCol <= 11 && eRow >= 7 && eRow <= 9); 
        
        let target;
        if (e.isDead) {
            target = { c: 9, r: 8 }; 
        } else if (inBase) {
            target = { c: 9, r: 6 }; 
        } else {
            if (e === enemyAlpha) target = currentTargets.alpha;
            else if (e === enemyBeta) target = currentTargets.beta;
            else if (e === enemyGamma) target = currentTargets.gamma;
            else if (e === enemyDelta) target = currentTargets.delta;
        }
        
        getEnemyMove(e, target.c, target.r);
    });
}

function checkCollisions() {
    for (let dot of dots) {
        if (!dot.collected && getDistance(player.x + TILE_SIZE/2, player.y + TILE_SIZE/2, dot.x, dot.y) < 10) {
            dot.collected = true; dotsRemaining--; dotsEatenThisLife++;
            if (dot.isPowerUp) { 
                score += 50; 
                enemyMode = 'FRIGHTENED'; 
                modeTimer = 0; 
                enemiesEatenThisPowerup = 0; 
            } else { 
                score += 10; 
            }
        }
    }
    if (dotsRemaining <= 0) { submitScoreAuto(); gameState = 'VICTORY'; debugPanel.style.display = 'none'; }

    for (let enemy of enemiesList) {
        if (enemy.active && !enemy.isDead && getDistance(player.x, player.y, enemy.x, enemy.y) < TILE_SIZE - 8) {
            if (enemyMode === 'FRIGHTENED') {
                let comboPoints = 200 * Math.pow(2, enemiesEatenThisPowerup);
                score += comboPoints;
                
                floatingTexts.push({ x: enemy.x, y: enemy.y, text: `+${comboPoints}`, timer: 60 });
                
                enemiesEatenThisPowerup++;
                enemy.isDead = true; 
                enemy.currentDir = OPPOSITE_DIR[enemy.currentDir] !== 'NONE' ? OPPOSITE_DIR[enemy.currentDir] : 'UP'; 
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
                    if (mapMatrix[r][c] === 3 && (r !== pRow || c !== pCol)) {
                        portals.push({r, c});
                    }
                }
            }
            if (portals.length > 0) {
                let dest = portals[Math.floor(Math.random() * portals.length)];
                player.x = dest.c * TILE_SIZE;
                player.y = dest.r * TILE_SIZE;
                portalCooldown = 60; 
            }
        }
    }
}

function submitScoreAuto() {
    if (scoreSubmitted) return;
    scoreSubmitted = true;
    fetch('http://localhost:3000/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'PLAYER', score: score })
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

function drawEntity(entity, isPlayer) {
    if (gameState === 'EDITOR') return;
    if (isPlayer) {
        ctx.save();
        ctx.translate(entity.x + TILE_SIZE/2, entity.y + TILE_SIZE/2);
        if (gameState === 'DYING') ctx.rotate(deathTimer * 0.5);
        ctx.fillStyle = entity.color;
        ctx.fillRect(-entity.size/2, -entity.size/2, entity.size, entity.size);
        ctx.restore();
    } else {
        if (entity.isDead) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0)'; 
            ctx.fillRect(entity.x + 4, entity.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.fillStyle = 'white'; 
            ctx.fillRect(entity.x + 8, entity.y + 10, 4, 4); 
            ctx.fillRect(entity.x + 20, entity.y + 10, 4, 4);
            return;
        }
        
        if (enemyMode === 'FRIGHTENED') ctx.fillStyle = (modeTimer > FRIGHTENED_DURATION - 120 && Math.floor(Date.now() / 200) % 2 === 0) ? '#ffffff' : '#0033ff';
        else ctx.fillStyle = entity.color;
        
        ctx.fillRect(entity.x + 4, entity.y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
        ctx.fillStyle = 'white'; ctx.fillRect(entity.x + 8, entity.y + 10, 4, 4); ctx.fillRect(entity.x + 20, entity.y + 10, 4, 4);
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

    debugPanel.style.display = 'block';
    debugPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 10px; color: #fff; text-align: center;">MODO DEBUG</div>
        <hr style="border-color: #00ffcc;">
        <br>
        FPS: ${currentFps}<br><br>
        JUGADOR: [${Math.floor(player.x/TILE_SIZE)}, ${Math.floor(player.y/TILE_SIZE)}]<br><br>
        MODO IA: ${enemyMode}<br><br>
        PUNTOS RES: ${dotsRemaining}<br><br>
        <span style="color:#ff0044">ALPHA: ${enemyAlpha.active ? 'ACT' : 'INACT'}</span><br><br>
        <span style="color:#ffb8ff">BETA:  ${enemyBeta.active ? 'ACT' : 'INACT'}</span><br><br>
        <span style="color:#00aaff">GAMMA: ${enemyGamma.active ? 'ACT' : 'INACT'}</span><br><br>
        <span style="color:#ffaa00">DELTA: ${enemyDelta.active ? 'ACT' : 'INACT'}</span>
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
    ctx.fillStyle = player.color; ctx.textAlign = 'center'; ctx.fillText('VIDAS: ' + lives, canvas.width / 2, 25); 
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
        ctx.fillStyle = '#00ffcc'; ctx.font = 'bold 50px Courier New'; ctx.textAlign = 'center'; ctx.fillText('VICTORIA', canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#ffffff'; ctx.font = '20px Courier New'; ctx.fillText('PUNTUACIÓN FINAL: ' + score, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillStyle = '#ff00ff'; ctx.font = '18px Courier New'; ctx.fillText('Presiona ENTER para ir al menú', canvas.width / 2, canvas.height / 2 + 70);
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