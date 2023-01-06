const App = {
    canvas: null,
    ctx: null,

    options: {debug: false},

    loops: {
        'menu': menuLoop,

        'map': {},

        'level': levelLoop
    },
    loop: 'menu',

    init() {
        console.info('Aztlan 0.1');

        this.canvas = document.querySelector('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.options.setLoop = this.setLoop.bind(this);

        this.setLoop(this.loop);
    },

    setLoop(loopName, config={}) {
        if (!this.loops[loopName]) throw new Error('Game Loop not found: ' + loopName);
        
        config.canvas = this.canvas;
        config.ctx = this.ctx;
        config.options = this.options;

        this.loops[this.loop].stop();

        this.loops[loopName].load(config);
        this.loop = loopName;
    }
};

window.addEventListener('load', App.init.bind(App));