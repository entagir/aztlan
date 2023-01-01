const App = {
    canvas: null,
    ctx: null,

    options: {debug: false},

    loops: {
        'menu': {
            menuImgReady: false,
            menuImg: new Image(),
            keydownBind: null,
            keyupBind: null,

            load(config={}) {
                this.canvas = config.canvas;
                this.ctx = config.ctx;
                this.final = config.final;
                this.appConfig = config.options || {};

                this.keydownBind = this.keydown.bind(this);
                this.keyupBind = this.keyup.bind(this);

                document.body.addEventListener('keydown', this.keydownBind, false);
                document.body.addEventListener('keyup', this.keyupBind, false);

                if (!this.menuImgReady) {
                    this.menuImg.src = 'images/menu.png';
                    this.menuImg.onload = function() {
                        this.menuImgReady = true;
                        this.draw_splash(this.canvas, this.ctx, this.final);
                    }.bind(this);
                    return;
                }
                
                this.draw_splash(this.canvas, this.ctx, this.final);
            },
            pause(){},
            stop(){
                document.body.removeEventListener('keydown', this.keydownBind, false);
                document.body.removeEventListener('keyup', this.keyupBind, false);
            },

            draw_splash(canvas, ctx, final) {
                let size = parseInt(canvas.height / 20);
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
                ctx.drawImage(this.menuImg, canvas.width / 2 - a / 2, canvas.height / 2 - a / 2, a, a);
            
                // Bottom text
                ctx.font = 'bold ' + 0.8 * size + 'px Arial';
                ctx.fillText(final ? 'Congrats!' : 'Press Enter to play!', canvas.width / 2, canvas.height - size);
            },

            keydown(e) {
                if (e.code == 'Enter') {
                    this.appConfig.setLoop('level');
                }
            },
            
            keyup(e) {}
        },

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