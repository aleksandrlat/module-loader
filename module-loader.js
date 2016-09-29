window.uniqueAppName = window.uniqueAppName || {};

/**
 * class Module
 */
uniqueAppName.module = (function(window){

var proto = Module.prototype,

/**
 * private class
 *
 * class Loader
 */
Loader = (function(window){
    var proto = Loader.prototype,

        /**
         * private static
         * @type {object}
         */
        scripts = {};

    /**
     * @constructor
     */
    function Loader(){}

    /**
     * create script DOM element, appends it to head
     *
     * @param {string} path
     */
    proto.load = function(path){
        if (scripts[path]) {
            return;
        }

        var script = window.document.createElement('SCRIPT');
        script.async = true;
        script.type = 'text/javascript';
        script.charset = 'UTF-8';
        script.src = path;
        window.document.getElementsByTagName('HEAD')[0].appendChild(script);

        scripts[path] = path;
    };

    return Loader;
})(window);

/**
 * @constructor
 */
function Module(){
    this.modules = {};
    this.subscribers = {};
    this.nameSpaceConfig = {};
    this.loader = new Loader();
}

/**
 * @param {string} basePath
 */
proto.setBasePath = function(basePath){
    if (basePath && basePath.substr(-1) != '/') {
        basePath += '/';
    }

    this.setNameSpaceConfig({'': basePath});
};

/**
 * @param {object} config
 */
proto.setNameSpaceConfig = function(config){
    this.nameSpaceConfig = config;
};

/**
 * @param {Array} dependencies
 * @param {string} name - module name
 * @param {function} create - module create func, use module names as parameters
 */
proto.define = function(dependencies, name, create) {
    var i;

    /**
     * calls onModuleDefined subscribers when a new module is initialized
     *
     * @type {function(this:Module, name:string)}
     */
    var callSubscribers = function(name) {
        if (this.subscribers[name]) {
            for (var i = 0; i < this.subscribers[name].length; i++) {
                this.subscribers[name][i]();
            }
            delete this.subscribers[name];
        }
    }.bind(this);

    /**
     * create onModuleDefined to incapsulate dependencies and create func
     * create module when all dependencies are loaded
     *
     * @type {function(this:Module)}
     */
    var onModuleDefined = function() {
        var args = [];
        for (var i = 0; i < dependencies.length; i++) {
            var dependency = dependencies[i];
            if (this.modules[dependency]) {
                args.push(this.modules[dependency]);
            } else {
                return;
            }
        }
        this.modules[name] = create.apply(window, args);
        callSubscribers(name);
    }.bind(this);

    // if no dependencies create module and fire all subscribers
    if (dependencies.length <= 0) {
        this.modules[name] = create();
        callSubscribers(name);
        return;
    }

    var args = [];
    for (i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];

        // if dependency is loaded push to args
        if (this.modules[dependency]) {
            args.push(this.modules[dependency]);
            continue;
        }

        if (!this.subscribers[dependency]) {
            this.subscribers[dependency] = [];
        }

        // add subscriber for dependency
        this.subscribers[dependency].push(onModuleDefined);

        for (var prefix in this.nameSpaceConfig) {
            if (dependency.substr(0, prefix.length) == prefix) {
                var basePath = this.nameSpaceConfig[prefix];
                this.loader.load(basePath + dependency.substr(prefix.length) +'.js');
                break;
            }
        }
    }

    // if all dependencies are loaded create module
    if (args.length == dependencies.length) {
        this.modules[name] = create.apply(window, args);
        callSubscribers(name);
    }
};

return new Module();

})(window);