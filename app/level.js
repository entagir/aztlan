// level.js

const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const ROTATED_HEXAGONAL_120_FLAG = 0x10000000;

class Anim {
    constructor(tileset, frames) {
        this.frames = [];

        for (const frame of frames) {
            this.frames.push(getCanvasBuffer(tileset, frame.x, frame.y, frame.w, frame.h));
        }
    }
}

class AnimTiled {
    constructor(frames, speed = 15) {
        this.frame = 0;
        this.frames = frames;
        this.speed = speed; // Frame per second
    }

    draw(ctx, x, y, w, h, flip) {
        if (!flip) {
            ctx.drawImage(this.frames[Math.floor(this.frame)], x, y, w, h);
        } else {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);

            ctx.drawImage(this.frames[Math.floor(this.frame)], 0, 0, w, h);

            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(1, 1);
        }
    }

    update(delta) {
        this.frame += this.speed * delta;

        if (Math.floor(this.frame) >= this.frames.length) {
            this.frame = 0;
        }
    }
}

class Player {
    x = 0;
    y = 0;
    w = 0;
    h = 0;
    vx = 0;
    vy = 0;
    speed = 8.3;
    jumpSpeed = 20;
    onGround = false;
    onJump = false;
    state = 0;
    dir = 0;

    anims = {};

    constructor() {}

    draw(ctx, offset, appConfig) {
        let anim = '';

        if (this.state == 0) { // Stay
            anim = 'stay';
        } else if (this.state == 1) { // Run
            anim = 'run';
        } else if (this.state == 2) { // Jump
            anim = 'jump';
        }

        this.anims[anim].draw(ctx, this.x - offset.x, this.y - offset.y, this.w, this.h, this.dir != 0);

        if (appConfig.debug) {
            ctx.strokeStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(this.x - offset.x + this.w / 2, this.y - offset.y);
            ctx.lineTo(this.x - offset.x + this.w / 2, this.y - offset.y + this.h);

            ctx.moveTo(this.x - offset.x, this.y - offset.y + this.h / 2);
            ctx.lineTo(this.x - offset.x + this.w, this.y - offset.y + this.h / 2);
            ctx.closePath();
            ctx.stroke();

            ctx.strokeRect(this.x - offset.x, this.y - offset.y, this.w, this.h);
        }
    }
}

const levelLoop = (function() {
    let appConfig = {};
    let canvas, ctx;

    let isPause, isStop = false;

    let fps = 0;
    let debugInfoUpdate = 0;

    let lastUpdate;
    let updateId;

    let player;

    let g = 0.8;

    let tileset;

    let tiles = [];
    const tileSize = 21;

    let layers = []; // Тайловые слои уровня
    let map; // Ссылка на тайловый слой "Platforms" для обработки столковений (основной слой уровня)

    let tileCount = 20; // Количество отображаемых тайлов по высоте (на один экран) - масштаб игры
    let size = 0; // Размер тайла в пикселях (вычисляется в зависимости от viewport)

    let score = 0;

    let offset = { x: 0, y: 0 };

    let keys = { 'right': false, 'left': false, 'up': false };

    function loadTileSet(img, tileSize) {
        tiles = [];

        for (let i = 0; i < img.height / tileSize; i++) {
            for (let j = 0; j < img.width / tileSize; j++) {
                tiles.push(getCanvasBuffer(img, j * tileSize, i * tileSize, tileSize, tileSize));
            }
        }
    }

    function loadLevelData(json) {
        for (const layer of json.layers) {
            let tempLayer = [];

            const data = layer.data;
            const width = parseInt(layer.width);

            for (let i = 0; i < data.length; i += width) {
                tempLayer.push(data.slice(i, i + width));
            }

            layers[layer.name] = tempLayer;
        }

        map = layers['Platforms'];

        player = new Player();
    }

    async function load(config = {}) {
        canvas = config.canvas;
        ctx = config.ctx;
        appConfig = config.options || {};

        isPause = isStop = false;
        score = 0;
        keys = { 'right': false, 'left': false, 'up': false };
        offset = { x: 0, y: 0 };

        document.body.addEventListener('keydown', keydown, false);
        document.body.addEventListener('keyup', keyup, false);

        const level = await fetch('res/aztlan1.json');
        const levelJSON = await level.json();
        loadLevelData(levelJSON);

        tileset = new Image();
        tileset.src = 'res/tilemap_packed.png';

        tileset.onload = function() {
            loadTileSet(tileset, tileSize);

            player.anims['stay'] = new AnimTiled([tiles[19]]);
            player.anims['run'] = new AnimTiled([tiles[26], tiles[27], tiles[28], tiles[29]]);
            player.anims['jump'] = new AnimTiled([tiles[21]]);

            size = parseInt(canvas.height / tileCount);

            player.w = size;
            player.h = size;
            player.x = 0;
            player.y = size * (map.length - 2);

            lastUpdate = performance.now();
            update();
        }
    }

    function stop() {
        console.log('stop', updateId);
        cancelAnimationFrame(updateId);
        isStop = true;

        document.body.removeEventListener('keydown', keydown, false);
        document.body.removeEventListener('keyup', keyup, false);
    }

    function update() {
        const now = performance.now();
        let delta = (now - lastUpdate) / 1000;
        if (debugInfoUpdate >= 1) {
            fps = 1 / delta;
            debugInfoUpdate = 0;
        } else { debugInfoUpdate += delta; }
        if (delta > 1 / 20) delta = 1 / 20;

        /* Update player */
        if (keys['right']) {
            if ((player.state != 1) || (player.dir != 0)) {
                player.vx = player.speed * size;
            }
        }

        if (keys['left']) {
            if (keys['right']) {
                player.vx = 0;
            } else {
                if ((player.state != 1) || (player.dir != 1)) {
                    player.vx = -1 * player.speed * size;
                }
            }
        }

        if (keys['up']) {
            if (player.onGround) {
                player.vy = -1 * player.jumpSpeed * size;
            }
        }

        player.x += player.vx * delta;
        col(0);

        if (!player.onGround) {
            player.vy += g * size;

            if (player.vy > 12 * size) {
                player.vy = 12 * size;
            }
        }
        player.y += player.vy * delta;
        col(1);

        const playerCenter = { x: player.x + player.w / 2, y: player.y + player.h / 2 };
        if (playerCenter.x > canvas.width / 2) {
            if (playerCenter.x + canvas.width / 2 < map[0].length * size) {
                offset.x = playerCenter.x - canvas.width / 2;
            } else {
                offset.x = map[0].length * size - canvas.width;
            }
        }
        if (playerCenter.y > canvas.height / 2) {
            if (playerCenter.y + canvas.height / 2 < map.length * size) {
                offset.y = playerCenter.y - canvas.height / 2;
            } else {
                offset.y = map.length * size - canvas.height;
            }
        }

        if (player.onGround) {
            if (player.vx == 0) { player.state = 0; }
            if ((player.vx != 0) || (player.vx == 0 && (keys['right'] || keys['left']))) {
                if (!(keys['right'] && keys['left'])) {
                    player.state = 1;
                }
            }
        } else {
            player.state = 2;
        }

        if (player.vx > 0 || (keys['right'] && !keys['left'])) {
            player.dir = 0;
        } else if (player.vx < 0 || (!keys['right'] && keys['left'])) {
            player.dir = 1;
        }

        /* Update animations */
        for (const anim in player.anims) {
            player.anims[anim].update(delta);
        }

        /* Draw and request next update */
        if (!isPause && !isStop) {
            draw(canvas, ctx);

            lastUpdate = now;
            updateId = requestAnimationFrame(update);
        }
    }

    function col(dir) {
        if (parseInt(player.y / size) < 0) return;
        if ((player.y + player.h) / size > map.length) {
            player.y = map.length * size - player.h;
        }

        if (player.x < 0) {
            player.x = 0;
        }
        if (player.x + player.w > map[0].length * size) {
            player.x = map[0].length * size - player.w;
        }

        let flag = false;

        for (let i = parseInt(player.y / size); i < (player.y + player.h) / size; i++) {
            for (let j = parseInt(player.x / size); j < (player.x + player.w) / size; j++) {
                if (map[i][j] == 0) continue;

                if (map[i][j] == 79) {
                    score++;
                    map[i][j] = 0;
                    continue;
                }

                if (map[i][j] == 254) {
                    appConfig.setLoop('menu', { final: true });
                }

                if (dir == 0) {
                    if (player.vx > 0) {
                        player.x = j * size - player.w;

                        player.vx = 0;
                    }

                    if (player.vx < 0) {
                        player.x = (j + 1) * size;

                        player.vx = 0;
                    }
                }

                if (dir == 1) {
                    if (player.vy > 0) {
                        player.y = i * size - player.h;

                        player.vy = 0;
                        flag = true;
                    }

                    if (player.vy < 0) {
                        player.y = (i + 1) * size;

                        player.vy = 0;
                    }
                }
            }
        }

        if (flag) {
            player.onGround = true;
        } else {
            player.onGround = false;
        }
    }

    function draw(canvas, ctx) {
        /* Background */
        ctx.fillStyle = '#6b8cff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        /* Level layers */
        drawLayer(layers['Background']);
        drawLayer(layers['Platforms']);

        if (appConfig.debug) {
            /* Level grid */
            ctx.strokeStyle = '#ccc';
            ctx.beginPath();
            for (let i = 0; i < map.length; i++) {
                ctx.moveTo(0, i * size - offset.y);
                ctx.lineTo(canvas.width, i * size - offset.y);
            }
            for (let i = 0; i < map[0].length; i++) {
                ctx.moveTo(i * size - offset.x, 0);
                ctx.lineTo(i * size - offset.x, canvas.height);
            }
            ctx.closePath();
            ctx.stroke();
        }

        /* Player */
        player.draw(ctx, offset, appConfig);

        /* Score */
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.font = 'bold ' + 1 / 2 * size + 'px Arial';
        ctx.fillText('Score: ' + score, 1 / 2 * size, 1 / 2 * size);

        if (appConfig.debug) {
            /* Center */
            ctx.strokeStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);

            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.closePath();
            ctx.stroke();

            /* State */
            ctx.fillStyle = '#000000';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.font = 'bold ' + 1 / 2 * size + 'px Arial';
            ctx.fillText('State: ' + player.state + '; OnGround: ' + player.onGround + '; vx: ' + player.vx + '; vy: ' + player.vy + ';', canvas.width / 2, 1 / 2 * size);

            /* FPS */
            ctx.textAlign = 'right';
            ctx.fillText('FPS: ' + fps.toFixed(1), canvas.width - 1 / 2 * size, 1 / 2 * size);
        }

        /* Draw tile layer */
        function drawLayer(layer) {
            for (let i in layer) {
                for (let j in layer[i]) {
                    if (layer[i][j] == '0') {
                        continue;
                    }

                    const flipped_horizontally = (layer[i][j] & FLIPPED_HORIZONTALLY_FLAG);
                    const flipped_vertically = (layer[i][j] & FLIPPED_VERTICALLY_FLAG);
                    const flipped_diagonally = (layer[i][j] & FLIPPED_DIAGONALLY_FLAG);
                    const rotated_hex120 = (layer[i][j] & ROTATED_HEXAGONAL_120_FLAG);

                    const tileId = layer[i][j] & ~(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG | ROTATED_HEXAGONAL_120_FLAG);

                    if (flipped_vertically || flipped_horizontally) {
                        ctx.translate(size * j - offset.x + (flipped_horizontally ? size : 0), size * i - offset.y + (flipped_vertically ? size : 0));
                        ctx.scale((flipped_horizontally ? -1 : 1), (flipped_vertically ? -1 : 1));
                        ctx.drawImage(tiles[tileId - 1], 0, 0, size, size);
                        ctx.scale(1, 1);
                        ctx.setTransform(1, 0, 0, 1, 0, 0);
                    } else {
                        ctx.drawImage(tiles[tileId - 1], size * j - offset.x, size * i - offset.y, size, size);
                    }

                    if (flipped_diagonally) { console.warn('TileLoader: FLIPPED_DIAGONALLY_FLAG not support'); }
                }
            }
        }
    }

    function getCanvasBuffer(img, x, y, w, h) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = w;
        frameCanvas.height = h;
        const frameCtx = frameCanvas.getContext('2d');

        frameCtx.drawImage(img, x, y, w, h, 0, 0, w, h);

        return frameCanvas;
    }

    function keydown(e) {
        if (e.code == 'ArrowRight') {
            keys['right'] = true;
        }

        if (e.code == 'ArrowLeft') {
            keys['left'] = true;
        }

        if (e.code == 'ArrowUp') {
            keys['up'] = true;
        }
    }

    function keyup(e) {
        if (e.code == 'ArrowRight') {
            keys['right'] = false;

            player.vx = 0;

            if (player.onGround) {
                player.state = 0;
            }
        }

        if (e.code == 'ArrowLeft') {
            keys['left'] = false;

            player.vx = 0;

            if (player.onGround) {
                player.state = 0;
            }
        }

        if (e.code == 'ArrowUp') {
            keys['up'] = false;
        }
    }

    return {
        load: load,
        stop: stop,
        pause: function() {},
    };
})();