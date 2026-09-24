const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewares obligatorios para permitir peticiones desde el navegador y leer JSON
app.use(cors());
app.use(express.json());

// Rutas de los archivos donde se guardará la información "para siempre"
const scoresFile = path.join(__dirname, 'scores.json');
const levelsFile = path.join(__dirname, 'levels.json');

// Función auxiliar para leer archivos JSON creando un archivo base si no existe
const readJsonFile = (file, defaultData) => {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error al leer el archivo:', error);
        return defaultData;
    }
};

// Función auxiliar para sobrescribir archivos JSON
const writeJsonFile = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error al escribir el archivo:', error);
    }
};

// ==========================================
// ENDPOINTS DE PUNTUACIONES (PROYECTO 4)
// ==========================================

app.get('/api/scores', (req, res) => {
    let scores = readJsonFile(scoresFile, []);
    // Ordenar de mayor a menor y devolver solo los 10 mejores
    scores.sort((a, b) => b.score - a.score);
    res.json(scores.slice(0, 10)); 
});

app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    
    if (!name || score === undefined) {
        return res.status(400).json({ error: 'Faltan el nombre o la puntuación' });
    }

    let scores = readJsonFile(scoresFile, []);
    scores.push({ name, score, date: new Date().toISOString() });
    writeJsonFile(scoresFile, scores);
    
    res.status(201).json({ message: 'Puntuación registrada exitosamente' });
});

// ==========================================
// ENDPOINTS DEL EDITOR DE NIVELES (NUEVO)
// ==========================================

app.get('/api/levels', (req, res) => {
    let levels = readJsonFile(levelsFile, []);
    res.json(levels);
});

app.post('/api/levels', (req, res) => {
    const { name, matrix } = req.body;
    
    if (!name || !matrix) {
        return res.status(400).json({ error: 'Faltan datos del nivel (nombre o matriz)' });
    }

    let levels = readJsonFile(levelsFile, []);
    levels.push({ name, matrix, createdAt: new Date().toISOString() });
    writeJsonFile(levelsFile, levels);
    
    res.status(201).json({ message: 'Nivel guardado exitosamente' });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor Backend ejecutándose en http://localhost:${PORT}`);
    console.log(`Endpoints activos:`);
    console.log(`- GET/POST /api/scores`);
    console.log(`- GET/POST /api/levels`);
});