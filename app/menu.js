// menu.js

const menuLoop = (function(){
    let layers = [];
    let tiles = [];
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
    let canvas, ctx;

    async function load(config = {}) {
        canvas = config.canvas;
        ctx = config.ctx;
        tiles = config.tiles;
        appConfig = config.options || {};

        keydownBind = keydown.bind(this);
        keyupBind = keyup.bind(this);

        document.body.addEventListener('keydown', keydownBind, false);
        document.body.addEventListener('keyup', keyupBind, false);

        const levelData = await Loader.load('assets/level/main_menu.json', 'json');
        layers = Renderer.loadLevelData(levelData).layers;

        size = parseInt(canvas.height / appConfig.tileCount);
        offset.x = (layers['Layer1'][0].length * size - canvas.width) / 2;
        offset.y = layers['Layer1'].length * size - canvas.height;
        draw(canvas, ctx);
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
        /* Background */
        ctx.fillStyle = '#6b8cff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        Renderer.drawLayer(ctx, layers['Background'], tiles, size, offset);
        Renderer.drawLayer(ctx, layers['Layer1'], tiles, size, offset);

        ctx.setLineDash([]);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = size / 5;
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

    function onresize() {
        size = parseInt(canvas.height / appConfig.tileCount);
        offset.x = (layers['Layer1'][0].length * size - canvas.width) / 2;
        offset.y = layers['Layer1'].length * size - canvas.height;
        draw(canvas, ctx);
    }

    return {
        load: load,
        stop: stop,
        onresize: onresize
    };
})();