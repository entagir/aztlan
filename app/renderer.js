// renderer.js
const FLIPPED_HORIZONTALLY_FLAG = 0x80000000;
const FLIPPED_VERTICALLY_FLAG = 0x40000000;
const FLIPPED_DIAGONALLY_FLAG = 0x20000000;
const ROTATED_HEXAGONAL_120_FLAG = 0x10000000;

const Renderer = (function () {
    function drawLayer(ctx, layer, tiles, size, offset) {
        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = layer[0].length * App.options.tileSize;
        bufferCanvas.height = layer.length * App.options.tileSize;
        const bufferCtx = bufferCanvas.getContext('2d');
        bufferCtx.imageSmoothingEnabled = false;

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
                const x = parseInt((tileId - 1) % (tiles.width / App.options.tileSize));
                const y = parseInt((tileId - 1) / (tiles.width / App.options.tileSize));

                if (flipped_vertically || flipped_horizontally) {
                    bufferCtx.translate(App.options.tileSize * j + (flipped_horizontally ? App.options.tileSize : 0), App.options.tileSize * i + (flipped_vertically ? App.options.tileSize : 0));
                    bufferCtx.scale((flipped_horizontally ? -1 : 1), (flipped_vertically ? -1 : 1));
                    bufferCtx.drawImage(tiles, x * App.options.tileSize, y * App.options.tileSize, App.options.tileSize, App.options.tileSize, 0, 0, App.options.tileSize, App.options.tileSize);
                    bufferCtx.scale(1, 1);
                    bufferCtx.setTransform(1, 0, 0, 1, 0, 0);
                } else {
                    bufferCtx.drawImage(tiles, x * App.options.tileSize, y * App.options.tileSize, App.options.tileSize, App.options.tileSize, App.options.tileSize * j, App.options.tileSize * i, App.options.tileSize, App.options.tileSize);
                }

                if (flipped_diagonally) { console.warn('TileLoader: FLIPPED_DIAGONALLY_FLAG not support'); }
            }
        }

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(bufferCanvas, 0, 0, bufferCanvas.width, bufferCanvas.height, -offset.x, -offset.y, layer[0].length * size, layer.length * size);
    }

    function getTileLayerBuffer(layer, tiles, size, offset) {
        size = App.options.tileSize;
        const bufferCanvas = document.createElement('canvas');
        bufferCanvas.width = layer[0].length * size;
        bufferCanvas.height = layer.length * size;
        const bufferCtx = bufferCanvas.getContext('2d');

        drawLayer(bufferCtx, layer, tiles, size, offset);

        return bufferCanvas;
    }

    function loadTileSet(img, tileSize, size) {
        let tiles = [];

        for (let i = 0; i < img.height / tileSize; i++) {
            for (let j = 0; j < img.width / tileSize; j++) {
                tiles.push(getCanvasBuffer(img, j * tileSize, i * tileSize, tileSize, tileSize, size, size));
            }
        }

        return tiles;
    }

    function loadLevelData(json) {
        let layers = [];
        let layersOfObject = [];

        for (const layer of json.layers) {
            if (layer.type == 'tilelayer') {
                let tempLayer = [];

                const data = layer.data;
                const width = parseInt(layer.width);

                for (let i = 0; i < data.length; i += width) {
                    tempLayer.push(data.slice(i, i + width));
                }

                layers[layer.name] = tempLayer;
            }

            if (layer.type == 'objectgroup') {
                layersOfObject[layer.name] = layer.objects;
            }
        }

        return { layers: layers, layersOfObject: layersOfObject };
    }

    return {
        drawLayer: drawLayer,
        getTileLayerBuffer: getTileLayerBuffer,
        loadTileSet: loadTileSet,
        loadLevelData: loadLevelData
    };
})();