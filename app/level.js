// level.js

class AnimTiled {
    constructor(tiles, frames, speed = 15) {
        this.tiles = tiles;
        this.frame = 0;
        this.frames = frames;
        this.speed = speed; // Frame per second
    }

    draw(ctx, x, y, w, h, flip) {
        const tile = this.frames[Math.floor(this.frame)];
        const xn = parseInt(tile % (this.tiles.width / App.options.tileSize));
        const yn = parseInt(tile / (this.tiles.width / App.options.tileSize));

        if (!flip) {
            ctx.drawImage(this.tiles, xn * App.options.tileSize, yn * App.options.tileSize, App.options.tileSize, App.options.tileSize, x, y, w, h);
        } else {
            ctx.translate(x + w, y);
            ctx.scale(-1, 1);

            ctx.drawImage(this.tiles, xn * App.options.tileSize, yn * App.options.tileSize, App.options.tileSize, App.options.tileSize, 0, 0, w, h);

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
    onWater = false;
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
            ctx.lineWidth = 2;
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

    let world, level;

    let tiles = [];

    let layers = []; // Tile layers of level
    let layerBuffers = []; // Buffers for static layers
    let layersOfObject = []; // Object layers of level
    let map; // Tile layer "Platforms"

    let size = 0; // Tile size in px

    let score = 0;

    let offset = { x: 0, y: 0 };

    let keys = { 'right': false, 'left': false, 'up': false };

    async function load(config = {}) {
        canvas = config.canvas;
        ctx = config.ctx;
        tiles = config.tiles;
        appConfig = config.options || {};
        
        if (!config.world) config.world = 1;
        if (!config.level) config.level = 1;

        isPause = isStop = false;
        score = 0;
        keys = { 'right': false, 'left': false, 'up': false };
        offset = { x: 0, y: 0 };
        layers = [];
        layersOfObject = [];

        document.body.addEventListener('keydown', keydown, false);
        document.body.addEventListener('keyup', keyup, false);

        world = config.world;
        level = config.level;

        size = parseInt(canvas.height / appConfig.tileCount);

        const levelData = await Loader.load('assets/level/aztlan_' + world + '_' + level + '.json', 'json');
        const loadedLevelData = Renderer.loadLevelData(levelData);
        layers = loadedLevelData.layers;
        layersOfObject = loadedLevelData.layersOfObject;

        map = layers['Platforms'];
        player = new Player();

        /* Generate tile layer buffers */
        if (layers['Background']) layerBuffers['Background'] = Renderer.getTileLayerBuffer(layers['Background'], tiles, size, offset);
        if (layers['Water']) layerBuffers['Water'] = Renderer.getTileLayerBuffer(layers['Water'], tiles, size, offset);
        if (layers['Platforms']) layerBuffers['Platforms'] = Renderer.getTileLayerBuffer(layers['Platforms'], tiles, size, offset);
        if (layers['Overlay']) layerBuffers['Overlay'] = Renderer.getTileLayerBuffer(layers['Overlay'], tiles, size, offset);

        /* Create player animations */
        player.anims['stay'] = new AnimTiled(tiles, [19]);
        player.anims['run'] = new AnimTiled(tiles, [26, 27, 28, 29]);
        player.anims['jump'] = new AnimTiled(tiles, [appConfig.tileSize]);

        /* Player deafult params */
        player.w = size;
        player.h = size;
        player.x = 0;
        player.y = size * (map.length - 2);

        /* Add dynamic objects */
        if (layersOfObject['Objects']) {
            for (const object of layersOfObject['Objects']) {
                if (object['class'] == 'Player') {
                    player.x = object.x * size / appConfig.tileSize;
                    player.y = object.y * size / appConfig.tileSize;
                }
    
                if (object['class'] == 'Lava') {
    
                }
    
                if (object['class'] == 'Finish') {
    
                }
            }
        }

        lastUpdate = performance.now();
        update();
    }

    function stop() {
        //console.log('stop', updateId);
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
        if (delta > 1 / 20) delta = 1 / 20; // Trottle

        /* Update player */
        if (keys['right']) {
            if ((player.state != 1) || (player.dir != 0)) {
                if (player.onWater) {
                    player.vx = player.speed / 1.5 * size;
                }
                else {
                    player.vx = player.speed * size;
                }
            }
        }

        if (keys['left']) {
            if (keys['right']) {
                player.vx = 0;
            } else {
                if ((player.state != 1) || (player.dir != 1)) {
                    if (player.onWater) {
                        player.vx = -1 * player.speed / 1.5 * size;
                    }
                    else {
                        player.vx = -1 * player.speed * size;
                    }
                }
            }
        }

        if (keys['up']) {
            if (player.onGround) {
                if (player.onWater) {
                    player.vy = -1 * player.jumpSpeed / 1.5 * size;
                }
                else {
                    player.vy = -1 * player.jumpSpeed * size;
                }
            }
        }

        player.x += player.vx * delta;
        col(0);

        if (!player.onGround) {
            player.vy += g * size;

            if (player.onWater) {
                player.vy -= g / 1.3 * size;

                if (player.vy > 4 * size) {
                    player.vy = 6 * size;
                }
            }
            else {
                if (player.vy > 12 * size) {
                    player.vy = 12 * size;
                }
            }
        }
        player.y += player.vy * delta;
        col(1);

        /** Update player state */
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

        player.onWater = false;
        for (let i = parseInt(player.y / size); i < (player.y + player.h) / size; i++) {
            for (let j = parseInt(player.x / size); j < (player.x + player.w) / size; j++) {
                if (layers['Water'] && layers['Water'][i][j] != 0) {
                    player.onWater = true;
                }
            }
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

        /** Update camera */
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
                    layerBuffers['Platforms'].getContext('2d').clearRect(appConfig.tileSize * j, appConfig.tileSize * i, appConfig.tileSize, appConfig.tileSize);

                    continue;
                }

                if (map[i][j] == 254) {
                    appConfig.setLoop('menu');
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
        ctx.imageSmoothingEnabled = true;

        /* Level layers */
        for (let layerName in layers) {
            ctx.drawImage(layerBuffers[layerName], 0, 0, layerBuffers[layerName].width, layerBuffers[layerName].height, -offset.x, -offset.y, layers[layerName][0].length * size, layers[layerName].length * size);
        }

        if (appConfig.debug) {
            /* Level grid */
            ctx.lineWidth = 2;
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
        ctx.setLineDash([]);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = size / 5 / 2;
        ctx.fillStyle = '#f9f9f9';
        ctx.strokeStyle = '#1c1c1c';

        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.font = 'bold ' + 1 / 2 * size + 'px bit';
        ctx.strokeText('Score: ' + score, 1 / 2 * size, 1 / 2 * size);
        ctx.fillText('Score: ' + score, 1 / 2 * size, 1 / 2 * size);

        if (appConfig.debug) {
            /* Center */
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, 0);
            ctx.lineTo(canvas.width / 2, canvas.height);

            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.closePath();
            ctx.stroke();

            /* State */
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#1c1c1c';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            ctx.font = 'bold ' + 1 / 2 * size + 'px bit';
            ctx.strokeText('State: ' + player.state + '; OnGround: ' + player.onGround + '; OnWater: ' + player.onWater + '; vx: ' + player.vx.toFixed(1) + '; vy: ' + player.vy .toFixed(1)+ ';', canvas.width / 2, 1 / 2 * size, canvas.width / 2);
            ctx.fillText('State: ' + player.state + '; OnGround: ' + player.onGround + '; OnWater: ' + player.onWater + '; vx: ' + player.vx.toFixed(1) + '; vy: ' + player.vy.toFixed(1) + ';', canvas.width / 2, 1 / 2 * size, canvas.width / 2);

            /* FPS */
            ctx.textAlign = 'right';
            ctx.strokeText('FPS: ' + fps.toFixed(1), canvas.width - 1 / 2 * size, 1 / 2 * size);
            ctx.fillText('FPS: ' + fps.toFixed(1), canvas.width - 1 / 2 * size, 1 / 2 * size);
        }
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

        if (e.code == 'Escape') {
            keys['up'] = appConfig.setLoop('menu');
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

    function onresize() {
        size = parseInt(canvas.height / appConfig.tileCount);

        player.w = size;
        player.h = size;
    }

    return {
        load: load,
        stop: stop,
        pause: function() {},
        onresize: onresize
    };
})();