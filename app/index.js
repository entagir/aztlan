const App = {
    canvas: null,
    ctx: null,

    options: {
        debug: false,
        tileCount: 20, // Tile count to screen height
    },

    loops: {
        'menu': menuLoop,

        'map': {},

        'level': levelLoop
    },
    loop: 'menu',

    async init () {
        console.info('Aztlan 0.1');

        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.options.setLoop = this.setLoop.bind(this);

        const tileset = await Loader.load('assets/tileset/tilemap_packed.png', 'img');
        this.options.tiles = tileset;
        this.options.tileSize = 21;

        this.setLoop(this.loop);

        window.addEventListener('resize', function() {
            App.canvas.width = App.canvas.clientWidth;
            App.canvas.height = App.canvas.clientHeight;

            if (App.loop) {
                App.loops[App.loop].onresize();
            } 
        });
    },

    setLoop(loopName, config={}) {
        if (!this.loops[loopName]) throw new Error('Game Loop not found: ' + loopName);
        
        config.canvas = this.canvas;
        config.ctx = this.ctx;
        config.tiles = this.options.tiles;
        config.options = this.options;

        this.loops[this.loop].stop();

        this.loops[loopName].load(config);
        this.loop = loopName;
    }
};

window.addEventListener('load', App.init.bind(App));