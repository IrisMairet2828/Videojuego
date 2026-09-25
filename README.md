Kawaii Cyber Maze
Proyecto integrador basado en Proyecto 4: Cyber Maze: Pursuit Protocol. Es un videojuego arcade web de persecución dentro de laberintos, desarrollado con HTML5, CSS3, JavaScript, Canvas 2D y Node.js.
Integrantes
- Iris Mairet Lucho Hernandez
- Pamela Ameli Aguirre Sanchez
Objetivo
Recoger todos los fragmentos del mapa mientras se evitan cuatro agentes enemigos con estrategias diferentes. Los power-ups activan temporalmente el modo vulnerable y permiten enviar a los enemigos al estado RETURN.
Tecnologías
- HTML5
- CSS3
- JavaScript
- Canvas 2D
- Node.js
- Express
- JSON
- Fetch API
- Git / GitHub
Requisitos
- Node.js y npm
- Git
- Navegador web moderno
Instalación
git clone https://github.com/IrisMairet2828/Videojuego.git
cd Videojuego\server
npm install
Ejecución
Desde la carpeta server:
node server.js
El backend se ejecuta en http://localhost:3000.
Después abre el cliente del proyecto con el método utilizado por el equipo para servir/abrir index.html.
Controles
Tecla	Acción
Flechas	Mover al jugador / navegar menús
ENTER	Seleccionar / continuar
ESC	Volver / salir del editor
P	Pausa
M	Activar o silenciar audio
F2	Modo Debug
1-6	Herramientas del editor
S	Guardar nivel en el editor


Estructura
Videojuego/
├── index.html
├── css/
├── js/
│   ├── GameLoop.js
│   └── AudioManager.js
├── img/
│   └── sprites.png
├── assets/
│   └── audio/
├── server/
│   ├── server.js
│   ├── scores.json
│   └── levels.json
└── README.md
Inteligencia artificial
Los enemigos calculan rutas con Breadth First Search (BFS) y tienen objetivos diferentes:
- Alpha: persigue la posición actual del jugador.
- Beta: apunta varios Tiles delante del jugador.
- Gamma: combina la posición futura del jugador con la posición de Alpha.
- Delta: persigue cuando está lejos y se retira cuando está cerca.
Estados disponibles: SPAWN, SCATTER, CHASE, FRIGHTENED y RETURN.
Editor de niveles
El editor permite colocar:
1. Suelo
2. Muro
3. Objeto
4. Portal
5. Inicio del jugador
6. Enemigo
Los niveles se guardan como estructuras JSON mediante Node.js y pueden cargarse posteriormente como mapas jugables.
API REST
Método	Endpoint	Descripción
GET	/api/scores	Consultar ranking
POST	/api/scores	Registrar puntuación
GET	/api/levels	Consultar niveles guardados
POST	/api/levels	Guardar un nivel


Persistencia
El backend utiliza archivos JSON para conservar:
- puntuaciones y fecha;
- matrices de niveles;
- punto inicial del jugador;
- cuatro puntos iniciales de enemigos.
Sprites y audio
El juego utiliza un Sprite Sheet de 256 x 224 px, dividido en una cuadrícula de 8 x 7 con celdas de 32 x 32 px. El estilo gráfico kawaii fue creado con apoyo de una herramienta de generación de imágenes y ajustado a la estructura requerida por el motor.
Los efectos de audio y la música fueron sintetizados específicamente para el proyecto.
Modo Debug
Se activa con F2 y permite visualizar información como FPS, posición en Tiles, estado de los enemigos, distancia al jugador, objetivos y rutas calculadas.
Repositorio
https://github.com/IrisMairet2828/Videojuego