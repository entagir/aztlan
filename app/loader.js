// loader.js

const Loader = (function(){
    let cache = [];

    async function load(src, type, callback) {
        if (cache[src]) {
            //console.log('[Loader] Load from cache: ' + src);
            return cache[src];
        }

        if (type == 'img') return await loadImage(src, callback);

        if (type == 'json') return await loadJSON(src, callback);
    }

    async function loadImage(src, callback) {
        cache[src] = null;
        return new Promise(function(resolve, reject) {
            const img = new Image();
            img.src = src;

            img.addEventListener('load', function() {
                cache[src] = img;
                if (typeof(callback) == 'function') callback(null, img);
                resolve(img);
            }, false);

            img.addEventListener('error', function(e) {
                if (typeof(callback) == 'function') callback(e);
                reject(e);
            }, false);
        });
    }

    async function loadJSON(src, callback) {
        cache[src] = null;

        const res = await fetch(src);
        const json = await res.json();
        cache[src] = json;

        if (typeof(callback) == 'function') callback(null, json);

        return json;
    }

    async function loadBlob(src, callback) {
        const res = await fetch(src);
        const blob = await res.blob();

        if (typeof(callback) == 'function') callback(null, blob);

        return blob;
    }

    return {
        cache: cache,
        load: load
    };
})();