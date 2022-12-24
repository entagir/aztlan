// Aztlan.js

let debug = false;

class Anim {
    constructor(tileset, frames) {
		this.frames = [];

		for (const frame of frames) {
			this.frames.push(getCanvasBuffer(tileset, frame.x, frame.y, frame.w, frame.h));
		}
    }
}

let canvas;
let ctx;

let player = {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    vx: 0,
    vy: 0,
    speed: 5,
    onGround: false,
    onJump: false,
    state: 0,
    dir: 0,
    frame: 0
};

player.anims = {};

let timer;

let speed = 1000 / 30;
let g = 0.7;

let keys = { 'right': false, 'left': false };

let img;

let tileset;
let background;

let tiles = [];

let menuImg;

let size = 0;
let scale = 1;

let score = 0;

let offset = { x: 0, y: 0 };

let onMenu = true;

let text_vis = false;
let texts = [];
texts[0] = 'Some text';
texts[1] = 'Some text';
texts[2] = 'Some text';

function text_show(n) {
    if (text_vis !== n) {
        text_vis = n;

        document.querySelector('#text').innerHTML = texts[n];
        document.querySelector('#text').classList.add('active');

        let text_timer = setTimeout(function() {
            text_vis = false;
            document.querySelector('#text').classList.remove('active');
        }, speed * 30 * 5);
    }
}

window.onload = function() {
    menuImg = new Image();

    background = new Image();

    tileset = new Image();
    tileset.src = 'images/atile.png';

    tileset.onload = function() {
		player.anims['stay'] = new Anim(tileset, [{ x: 64, y: 16, w: 16, h: 16 }]);
		player.anims['run'] = new Anim(tileset, [{ x: 0, y: 16, w: 16, h: 16 }, { x: 16, y: 16, w: 16, h: 16 }, { x: 32, y: 16, w: 16, h: 16 }]);
		player.anims['jump'] = new Anim(tileset, [{ x: 48, y: 16, w: 16, h: 16 }]);

		tiles['b'] = getCanvasBuffer(tileset, 32, 0, 16, 16);
		tiles['c'] = getCanvasBuffer(tileset, 48, 0, 16, 16);
		tiles['d'] = getCanvasBuffer(tileset, 0, 0, 16, 16);
		tiles['e'] = getCanvasBuffer(tileset, 16, 0, 16, 16);

        menuImg.src = 'images/menu.png';
        menuImg.onload = function() {
            background.src = 'images/background.png';
            background.onload = function() {
                init();
            }
        }
    }

    canvas = document.querySelector('canvas');
	ctx = canvas.getContext('2d');
}

function init() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    size = parseInt(canvas.height / map.length);
    scale = canvas.height / map.length / size;

    player.w = size;
    player.h = size;

    g *= size;

    for (let i in map) {
        let flag = false;

        for (let j in map[i]) {
            if (map[i][j] == 'p') {
                player.x = size * j;
                player.y = size * i;

                map[i][j] = '0';

                break;
            }
        }

        if (flag) { return; }
    }

    document.body.addEventListener('keydown', keydown, false);
    document.body.addEventListener('keyup', keyup, false);

    draw_splash();
}

function draw_splash() {
    // Background
    ctx.fillStyle = '#6b8cff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Top text
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.font = 'bold ' + 1 * size + 'px Arial';
    ctx.fillText('Aztlan', canvas.width / 2, size);

    // Img
    let a = canvas.height / 1.5;
    ctx.drawImage(menuImg, canvas.width / 2 - a / 2, canvas.height / 2 - a / 2, a, a);

    // Bottom text
    ctx.font = 'bold ' + 0.8 * size + 'px Arial';
    ctx.fillText('Press Enter to play!', canvas.width / 2, canvas.height - size);
}

function update() {
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
            player.vy = -13 * size;
        }
    }

    player.x += player.vx * speed / 1000;
    col(0);

    if (!player.onGround) {
        if (player.vy < 8 * size) {
            player.vy += g;
        }
    }
    player.y += player.vy * speed / 1000;
    col(1);

    if (player.x > canvas.width / 2 && player.x + canvas.width / 2 < map[0].length * size) {
        offset.x = player.x - canvas.width / 2;
    }
    /*
    if(player.y > canvas.height/2)
    {
    	offset.y = player.y - canvas.height/2;
    }*/

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

    if (player.vx > 0 || (keys['right'] && !keys['left'])) { player.dir = 0; } else if (player.vx < 0 || (!keys['right'] && keys['left'])) { player.dir = 1; }

    draw();
}

function col(dir) {
    let flag = false;

    for (let i = parseInt(player.y / size); i < (player.y + player.h) / size; i++) {
        for (let j = parseInt(player.x / size); j < (player.x + player.w) / size; j++) {
            if (map[i][j] == 'b' || map[i][j] == 'a' || map[i][j] == 'd' || map[i][j][0] == 'e' || map[i][j] == 'o' || map[i][j] == 'p' || map[i][j] == 'l' || map[i][j] == ';') {
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

                        if (map[i][j][0] == 'e') {
                            text_show(map[i][j][1]);
                        }
                    }
                }
            }

            if (map[i][j] == 'c') {
                map[i][j] = '0';
                score++;
            }
        }
    }

    if (flag) {
        player.onGround = true;
    } else {
        player.onGround = false;
    }
}

function draw() {
    // Background
    ctx.fillStyle = '#6b8cff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(scale, scale);

    let bw = background.width * (14 * size / background.height);

    for (let i = 0; i < map[0].length; i += bw / size) {
        ctx.drawImage(background, size * i - offset.x, 0, bw, 14 * size);
    }

    // Map
    for (let i in map) {
        for (let j in map[i]) {
            if (map[i][j] == '0') {
                continue;
            }

            if (map[i][j] == 'a') {
                continue;
            }

            if (map[i][j] == 'b') {
                ctx.fillStyle = '#8B6914';
                ctx.drawImage(tiles['b'], size * j - offset.x, size * i - offset.y, size, size);
            }

            if (map[i][j] == 'c') {
                ctx.fillStyle = '#3B8B14';
                ctx.drawImage(tiles['c'], size * j - offset.x, size * i - offset.y, size, size);
            }

            if (map[i][j] == 'd') {
                ctx.drawImage(tiles['d'], size * j - offset.x, size * i - offset.y, size, size);
            }

            if (map[i][j][0] == 'e') {
                ctx.drawImage(tiles['e'], size * j - offset.x, size * i - offset.y, size, size);
            }
        }
    }

    // Draw text
    /*
    if(text_vis !== false)
    {
    	ctx.fillStyle = '#000000';
    	ctx.textBaseline = 'middle';
    	ctx.textAlign = 'center';
    	ctx.font = 'bold ' + 1/2 * size + 'px Arial';
    	ctx.fillText(texts[text_vis], canvas.width/2, 5*size, canvas.width/1.5);
    }
    * */

    player.draw(ctx);

    // Score
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = 'bold ' + 1 / 2 * size + 'px Arial';
    ctx.fillText('Score: ' + score, 1 / 2 * size, 1 / 2 * size);

	if (debug) {
		// State
		ctx.fillStyle = '#000000';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		ctx.font = 'bold ' + 1 / 2 * size + 'px Arial';
		ctx.fillText('State: ' + player.state + '; OnGround: ' + player.onGround + '; vx: ' + player.vx+'; vy: ' + player.vy + ';', canvas.width / 2, 1 / 2 * size);
	}
}

let map = [
    ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', '0', '0', '0', '0', '0', 'c', 'c', 'c', 'c', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', 'd', 'd', 'd', '0', '0', '0', '0', '0', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', 'c', '0', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'e2', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', 'e0', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', 'e1', 'd', 'd', 'd', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', '0', 'a'],
    ['a', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', '0', 'a'],
    ['a', 'p', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', 'c', 'c', 'c', 'c', 'c', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', 'd', '0', '0', '0', 'a'],
    ['b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b']
];

player.draw = function(ctx) {
    let frame;

    if (this.state == 0) { // Stay
        if (Math.floor(this.frame) >= this.anims['stay'].frames.length) {
            this.frame = 0;
        }

        frame = this.anims['stay'].frames[Math.floor(this.frame)];
    }
	else if (this.state == 1) { // Run
        if (Math.floor(this.frame) >= this.anims['run'].frames.length) {
            this.frame = 0;
        }

        frame = this.anims['run'].frames[Math.floor(this.frame)];
    }
	else if (this.state == 2) { // Jump
        if (Math.floor(this.frame) >= this.anims['jump'].frames.length) {
            this.frame = 0;
        }

        frame = this.anims['jump'].frames[Math.floor(this.frame)];
    }

    if (this.dir == 0) {
        ctx.drawImage(frame, player.x - offset.x, player.y - offset.y, player.w, player.h);
    }
	else if (this.dir == 1) {
        ctx.translate(player.x + player.w - offset.x, player.y - offset.y);
        ctx.scale(-1, 1);

        ctx.drawImage(frame, 0, 0, player.w, player.h);

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(scale, scale);
    }

    this.frame = this.frame + 0.4;
}

function keydown(e) {
    if (onMenu) {
        if (e.code == 'Enter') {
            timer = setInterval(update, speed);

            onMenu = false;
        }

        return;
    }

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

function getCanvasBuffer(img, x, y, w, h) {
	const frameCanvas = document.createElement('canvas');
	frameCanvas.width = w;
	frameCanvas.height = h;
	const frameCtx = frameCanvas.getContext('2d');

	frameCtx.drawImage(img, x, y, w, h, 0, 0, w, h);
	
	return frameCanvas;
}