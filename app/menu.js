// menu.js

const menuLoop = (function(){
    let layers = [];
    let size = 1;
    let offset = {x:0, y:0};
    let keydownBind = null;
    let keyupBind = null;

    let menu = [{
            title: 'Level 1',
            handler: function() { appConfig.setLoop('level', { level: 1 }); }
        },
        {
            title: 'Level 2',
            menu: [{
                    title: 'level 1',
                    handler: function() { appConfig.setLoop('level', { level: 1 }); }
                },
                {
                    title: 'level 2',
                    handler: function() { appConfig.setLoop('level', { level: 2 }); }
                }
            ],
            handler: function() { appConfig.setLoop('level', { level: 2 }); }
        },
        {
            title: 'Level 3',
            handler: function() { appConfig.setLoop('level', { level: 3 }); }
        },
    ];
    let menuSelected = 0;
    let final, appConfig;

    async function load(config = {}) {
        canvas = config.canvas;
        ctx = config.ctx;
        final = config.final;
        appConfig = config.options || {};

        keydownBind = keydown.bind(this);
        keyupBind = keyup.bind(this);

        document.body.addEventListener('keydown', keydownBind, false);
        document.body.addEventListener('keyup', keyupBind, false);

        const levelData = await Loader.load('assets/level/main_menu.json', 'json');
        loadLevelData(levelData);

        tileset = await Loader.load('assets/tileset/tilemap_packed.png', 'img');
    
        loadTileSet(tileset, 21);

        size = parseInt(canvas.height / 20);

        offset.x = (layers['Layer1'][0].length * size - canvas.width) / 2;
        offset.y = layers['Layer1'].length * size - canvas.height;

        draw(canvas, ctx, final);
    }

    function pause() {}

    function stop() {
        document.body.removeEventListener('keydown', keydownBind, false);
        document.body.removeEventListener('keyup', keyupBind, false);

        menuImg = null;
        keydownBind = null;
        keyupBind = null;
    }

    function draw(canvas, ctx, final) {
        let size = parseInt(canvas.height / 20);

        /* Background */
        ctx.fillStyle = '#6b8cff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawLayer(layers['Background']);
        drawLayer(layers['Layer1']);

        ctx.setLineDash([]);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = 8;
        ctx.fillStyle = '#f9f9f9';
        ctx.strokeStyle = '#1c1c1c';

        /* Top text */
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.font = 'bold ' + 1 * size + 'px bit';

        ctx.strokeText('Aztlan', canvas.width / 2, size);
        ctx.fillText('Aztlan', canvas.width / 2, size);

        /* Menu */
        const padding = size / 2;

        for (let [i, item] of menu.entries()) {
            const offsetY = -(menu.length / 2 - i) * (size + padding) + (size + padding) / 2;

            ctx.strokeText(item.title, canvas.width / 2, canvas.height / 2 + offsetY);
            ctx.fillText(item.title, canvas.width / 2, canvas.height / 2 + offsetY);

            if (menuSelected == i) {
                const width = ctx.measureText(item.title).width;

                drawArrow(ctx, canvas.width / 2 - width / 2, canvas.height / 2 + offsetY, size / 2);
            }
        }

        /* Controls */
        const controlsText = [
            'Controls',
            '',
            'Menu',
            'Up / Down - menu item selection',
            'Enter - go to selected menu item',
            '',
            'Game',
            'Left / Right - move',
            'Up - jump',
            'Esc - return to menu'
        ];

        ctx.textAlign = 'left';
        ctx.font = 'bold ' + 0.8 * size + 'px bit';

        for (const [i, line] of controlsText.entries()) {
            const offsetY = -(controlsText.length / 2 - i) * (size + padding) + (size + padding) / 2;

            ctx.strokeText(line, size, canvas.height / 2 + offsetY);
            ctx.fillText(line, size, canvas.height / 2 + offsetY);
        }

        /* Info */
        const infoText = [
            'Tiles by Kenney.nl'
        ];

        ctx.textAlign = 'right';

        for (const [i, line] of infoText.entries()) {
            const offsetY = -(infoText.length / 2 - i) * (size + padding) + (size + padding) / 2;

            ctx.strokeText(line, canvas.width - size, canvas.height / 2 + offsetY);
            ctx.fillText(line, canvas.width - size, canvas.height / 2 + offsetY);
        }

        /* Bottom text */
        // ctx.font = 'bold ' + 0.8 * size + 'px bit';
        // ctx.fillText('Press Enter', canvas.width / 2, canvas.height - size);
        // ctx.strokeText('Press Enter', canvas.width / 2, canvas.height - size);

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
        }

        function drawArrow(ctx, x, y, size) {
            const margin = size / 4;

            ctx.beginPath();

            ctx.moveTo(x - margin, y);
            ctx.lineTo(x - size - margin, y - size / 2);
            ctx.lineTo(x - size - margin, y + size / 2);

            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        }
    }

    function keydown(e) {
        if (e.code == 'Enter') {
            if (typeof(menu[menuSelected].handler) == 'function') menu[menuSelected].handler();
        }

        if (e.code == 'ArrowDown') {
            if (menuSelected + 1 < menu.length) menuSelected++;
            draw(canvas, ctx, final);
        }

        if (e.code == 'ArrowUp') {
            if (menuSelected > 0) menuSelected--;
            draw(canvas, ctx, final);
        }
    }

    function keyup(e) {}

    /* CopyPaste from level.js */

    /* Draw tile layer */
    function drawLayer(layer) {
        const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
        const FLIPPED_VERTICALLY_FLAG = 0x40000000;
        const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
        const ROTATED_HEXAGONAL_120_FLAG = 0x10000000;

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
    }

    function getCanvasBuffer(img, x, y, w, h) {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = w;
        frameCanvas.height = h;
        const frameCtx = frameCanvas.getContext('2d');

        frameCtx.drawImage(img, x, y, w, h, 0, 0, w, h);

        return frameCanvas;
    }

    return {
        load: load,
        stop: stop
    };
})();