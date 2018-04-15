/**
 * Real Uploader
 * http://www.realuploader.com/ajaxuploader
 * Build date Fri May 27 2016 19:46:43 GMT+0100 (IST)
 * Copyright 2010-2015, Xscripts, http://www.albanx.com
 */
(function (root, factory) {
    var myLibrary = factory();
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.realuploader = root.RealUploader = myLibrary;
    }

    //export as jquery plugin if jquery is present
    if (root.jQuery) {
        root.jQuery.fn.realuploader = function ( options ) {
            return this.each(function () {
                if ( !root.jQuery.data(this, "RealUploader") ) {
                    root.jQuery.data(this, "RealUploader", new myLibrary( this, options ));
                }
            });
        };
    }
}(this, function () {/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});


define(/** @lends Constants */ 'Constants',[],function(){
    /**
     * @constants Constants
     * Real Ajax Uploader constants and events for internal use
     */
    var Constants = {
        AX_ERROR:       -1,
        AX_IDLE:        0,
        AX_DONE:        1,
        AX_UPLOADING:   2,
        AX_CHECK:       3,
        AX_READY:       4,
        AX_NO_FILES:    5,
        events: {
            finish:             'upload_finish',
            finishFile:         'upload_finish_file',
            start:              'start_upload',
            startFile:          'start_upload_file',
            progress:           'progress',
            progressFile:       'progress_file',
            beforeUpload:       'before_upload',
            beforeUploadFile:   'before_upload_file',
            md5Done:            'md5_calculated',
            exifDone:           'exif_decoded',
            beforePreview:      'before_preview',
            preview:            'preview_done'
        },
        ENV: 'PROD', //dev/production: useful if need to enable log on windows console
        IMAGE_SCALE_ON: true,
        MD5_ON: true,
        EXIF_ON: true,
        VERSION: ''
    }

    return Constants;
});
/**
 * @author Alban Xhaferllari
 * Base i18n System For Real Ajax Uploader
 * @file Translator
 */
define(/** @lends Translator */ 'i18n',[],function () {
    var LOCALE = {
        'en_EN': {
            'Add files': 'Add files',
            'Start upload': 'Start upload',
            'Remove all': 'Remove all',
            'Close': 'Close',
            'Select Files': 'Select Files',
            'Preview': 'Preview',
            'Remove file': 'Remove file',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Upload aborted',
            'Upload all files': 'Upload files',
            'Select Files or Drag&Drop Files': 'Select Files or Drag&Drop Files',
            'File uploaded 100%': 'File uploaded 100%',
            'Max files number reached': 'Max files number reached',
            'Extension not allowed': 'Extension not allowed',
            'File size now allowed': 'File size now allowed'
        },
        'it_IT': {
            'Add files': 'Aggiungi file',
            'Start upload': 'Carica tutto',
            'Remove all': 'Rimuvi tutti',
            'Close': 'Chiudi',
            'Select Files': 'Seleziona',
            'Preview': 'Anteprima',
            'Remove file': 'Rimuovi file',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Interroto',
            'Upload all files': 'Carica tutto',
            'Select Files or Drag&Drop Files': 'Seleziona o Trascina qui i file',
            'File uploaded 100%': 'File caricato 100%',
            'Max files number reached': 'Max files number reached',
            'Extension not allowed': 'Estensione file non permessa',
            'File size now allowed': 'Dimensione file non permessa'
        },
        'sq_AL': {
            'Add files': 'Shto file',
            'Start upload': 'Fillo karikimin',
            'Remove all': 'Hiqi te gjithë',
            'Close': 'Mbyll',
            'Select Files': 'Zgjith filet',
            'Preview': 'Miniaturë',
            'Remove file': 'Hiqe file-in',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Karikimi u ndërpre',
            'Upload all files': 'Kariko të gjithë',
            'Select Files or Drag&Drop Files': 'Zgjith ose Zvarrit dokumentat këtu',
            'File uploaded 100%': 'File u karikua 100%',
            'Max files number reached': 'Maksimumi i fileve u arrit',
            'Extension not allowed': 'Prapashtesa nuk lejohet',
            'File size now allowed': 'Madhësia e filit nuk lejohet'
        },
        'nl_NL': {
            'Add files': 'Bestanden toevoegen',
            'Start upload': 'Start uploaden',
            'Remove all': 'Verwijder alles',
            'Close': 'Sluiten',
            'Select Files': 'Selecteer bestanden',
            'Preview': 'Voorbeeld',
            'Remove file': 'Verwijder bestand',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Upload afgebroken',
            'Upload all files': 'Upload alle bestanden',
            'Select Files or Drag&Drop Files': 'Selecteer bestanden of  Drag&Drop bestanden',
            'File uploaded 100%': 'Bestand geüpload 100%'
        },
        'de_DE': {
            'Add files': 'Dateien hinzufügen',
            'Start upload': 'Hochladen',
            'Remove all': 'Alle entfernen',
            'Close': 'Schliessen',
            'Select Files': 'Dateien wählen',
            'Preview': 'Vorschau',
            'Remove file': 'Datei entfernen',
            'Bytes': 'Bytes',
            'KB': 'KB',
            'MB': 'MB',
            'GB': 'GB',
            'Upload aborted': 'Upload abgebrochen',
            'Upload all files': 'Alle hochgeladen',
            'Select Files or Drag&Drop Files': 'Wählen Sie Dateien oder fügen Sie sie mit Drag & Drop hinzu.',
            'File uploaded 100%': 'Upload 100%'
        },
        'fr_FR': {
            'Add files': 'Ajouter',
            'Start upload': 'Envoyer',
            'Remove all': 'Tout supprimer',
            'Close': 'Fermer',
            'Select Files': 'Parcourir',
            'Preview': 'Visualiser',
            'Remove file': 'Supprimer fichier',
            'Bytes': 'Bytes',
            'KB': 'Ko',
            'MB': 'Mo',
            'GB': 'Go',
            'Upload aborted': 'Envoi annulé',
            'Upload all files': 'Tout envoyer',
            'Select Files or Drag&Drop Files': 'Parcourir ou Glisser/Déposer',
            'File uploaded 100%': 'Fichier envoyé 100%'
        },
        'es_ES':  {
            'Add files':            'Agregar',
            'Start upload':            'Iniciar',
            'Remove all':            'Quitar todo',
            'Close':                'Cerrar',
            'Select Files':            'Seleccionar',
            'Preview':                'Visualizar',
            'Remove file':            'Eliminar Archivo',
            'Bytes':                'Bytes',
            'KB':                    'KB',
            'MB':                    'MB',
            'GB':                    'GB',
            'Upload aborted':        'Subida cancelada',
            'Upload all files':        'Subir todos',
            'Select Files or Drag&Drop Files':    'Seleccionar o Arrastrar&Soltar Archivos',
            'File uploaded 100%':                'Archivo subido al 100%',
            'Max files number reached':            'Numero max de Archivos alcanzado',
            'Extension not allowed':            'Extension prohibida',
            'File size now allowed':            'Archivo demasiado grande'
        }
    };

    /**
     * A simple singleton for translation
     * @param s string to translate, language on first call of the singleton
     * @returns {*} translated string
     * @constructor
     */
    var Translator = function() {
        var s = arguments[0];
        if ( !Translator.prototype._singletonInstance ) {
            Translator.prototype._singletonInstance = this;
            this.lang = s;
        }else if(s) {
            var me = Translator.prototype._singletonInstance;
            return me.lang && LOCALE[me.lang] !== undefined && LOCALE[me.lang][s] !==undefined ? LOCALE[me.lang][s] : s;
        }
    };
    return Translator;
});
/**
 * @author Alban Xhaferllari
 * XScripts
 * Used in Real Ajax Uploader
 * Common utilities function
 */


define('Utils',['i18n', 'Constants'], function(_, Constants) {
    var Utils = {
        /**
         * Run a function in background using WebWorkers
         * @param job the function to run
         * @returns {Worker}
         */
        runInBackground: function (job) {
            // Build a worker from an anonymous function body
            var blobURL = URL.createObjectURL(new Blob(['(',

                function (job) {
                    function startJob(passeddata) {
                        job(passeddata);
                    }

                    self.addEventListener("message", function (e) {
                        startJob(e.data);
                    }, !1);

                }.toString(),

                ')(', job.toString(), ')'], {type: 'application/javascript'}));

            var worker = new Worker(blobURL);
            return worker;
        },
        /**
         * Standard function to splice a file
         * @param blob Blob or File
         * @param start start index
         * @param end end index
         * @returns blob
         */
        sliceFile: function (blob, start, end) {
            try {
                blob.slice();	// deprecated version will throw WRONG_ARGUMENTS_ERR exception
                var slice = window.File.prototype.slice || window.File.prototype.webkitSlice || window.File.prototype.mozSlice;
                return blob.slice(start, end);
            } catch (e) {
                return blob.slice(start, end - start);// deprecated old slice method
            }
            return null;
        },
        /**
         * Short hand method for creating a dom element
         * @param type {String} type of element
         * @param cls {String} class
         * @param style {Object} style to apply
         * @returns {HTMLElement}
         */
        doEl: function (type, cls, attrs, style) {
            var el = document.createElement(type);
            //add class to element
            this.addCls(el, cls);
            if (attrs) {
                for (var prop in attrs) {
                    el.setAttribute(prop, attrs[prop]);
                }
            }

            this.setStyle(el, style);
            return el;
        },
        /**
         * Set the style of dom element
         * @param {HTMLElement} el
         * @param {Object} style
         * @returns {HTMLElement}
         */
        setStyle: function (el, style) {
            if (style) {
                for (var prop in style) {
                    el.style[prop] = style[prop];
                }
            }
            return el;
        },
        /**
         * Add a class to a dom element
         * @param {HTMLElement} el
         * @param {String} cls
         * @returns {*}
         */
        addCls: function (el, cls) {
            if (cls && "classList" in el) {
                el.classList.add(cls);
            } else if (cls) { //this is only for supporting old browser IE9 (?!)
                el.className + ' ' + cls;
            }
            return el;
        },
        /**
         * Short name helper function for finding an element by class name
         * @param parent parent element
         * @param cls class to find
         * @param first if true returns only the first matched element
         * @returns {NodeList} list of found elements
         */
        byCls: function (cls, parent, first) {
            if (!parent) parent = document;
            var els = parent.getElementsByClassName(cls)
            return parent.getElementsByClassName(cls);
        },
        /**
         * Get the first element match the selector
         * @param el dynamic element if defined is the parent container, if not define is the document
         * @param selector if defined as second parameter is the selector,
         * @returns {HTMLElement}
         */
        getEl: function() {
            if(arguments.length == 1) {
                return document.querySelector(arguments[0]);
            }
            try{
                if(arguments[0] && arguments[0].querySelector)
                    return arguments[0].querySelector(arguments[1]);
            }catch(e){
                return null;
            }
            return null;
        },
        /**
         * Get all the elements matching the selector
         * @param el dynamic element if defined is the parent container, if not define is the document
         * @param selector if defined as second parameter is the selector
         * @returns {NodeList}
         */
        getEls: function() {
            if(arguments.length == 1) {
                return document.querySelectorAll(arguments[0]);
            }
            return arguments[0].querySelectorAll(arguments[1]);
        },
        /**
         * Helper function for formatting a size from number to human readable
         * @param {number} size
         * @returns {string} the formatted string
         */
        formatSize: function (size) {
            var suffix = [_('b'), _('KB'), _('MB'), _('GB')];
            var i = 0;

            while (size >= 1024 && (i < (suffix.length - 1))) {
                size /= 1024;
                i++;
            }
            var intVal      = Math.round(size);
            var multiFactor = Math.pow(10, 2); //set a default precision decimal of 2
            var floor       = Math.round((size * multiFactor ) % multiFactor);
            return intVal + '.' + floor + ' ' + suffix[i];
        },

        /**
         * Fast extend deep function. Faster than jQuery and other methods
         * @param target The target object to override the new properties
         * @param source Source object with new values
         * @param shallow internal parameter use for the recursive
         * @returns Object {*}
         */
        extend: function (target, source, shallow) {
            var array = '[object Array]', object = '[object Object]', targetMeta, sourceMeta;
            var setMeta = function (value) {
                if (value === undefined) return 0;
                if (typeof value !== 'object') return false;
                var jClass = {}.toString.call(value);
                if (jClass === array) return 1;
                if (jClass === object) return 2;
            };
            for (var key in source) {
                if (source.hasOwnProperty(key)) {
                    targetMeta = setMeta(target[key]), sourceMeta = setMeta(source[key]);

                    if (!shallow && sourceMeta && targetMeta && targetMeta === sourceMeta) {
                        target[key] = this.extend(target[key], source[key], true);
                    } else if (sourceMeta !== 0) {
                        target[key] = source[key];
                    }
                } // ownProperties are always first
            }
            return target;
        },
        /**
         * Show the current image in a lightBox preview
         * Related to light-box.css
         * @param image Image to show or file to preview
         * @param title Name of the image or a title
         * @param info Other info to show near the name
         * @param cssClass Classes to add to the image container
         * @return {DOM} returns the main dom object
         */
        lightBoxPreview: function (image, title, info, cssClass) {

            //create the box for the preview
            var mainBox     = this.doEl('div', 'ax-lightbox-target', {});
            var imageBox    = this.doEl('div', 'ax-image-box', {});
            var imageEl     = this.doEl('img', 'ax-image-prev', {src: image.src});
            var infoBox     = this.doEl('div', 'ax-info-box', {});
            var fnBox       = this.doEl('div', 'ax-name-box', {});
            var sizeBox     = this.doEl('div', 'ax-size-box', {});
            var closeBox    = this.doEl('a', 'ax-lightbox-close', {});

            //append elements to dom
            mainBox.appendChild(imageBox);
            mainBox.appendChild(closeBox);
            mainBox.appendChild(infoBox);
            imageBox.appendChild(imageEl);
            infoBox.appendChild(fnBox);
            infoBox.appendChild(sizeBox);
            document.body.appendChild(mainBox);

            //set the information
            fnBox.innerHTML = title;
            sizeBox.innerHTML = info;

            if(cssClass) {
                imageEl.className +=' ' + cssClass;
            }
            //apply a small timeout to allow dom render
            setTimeout(function () {
                mainBox.classList.add('show');
            }, 100);

            //the close box function
            //remove some references for memory performance use
            var killBox = function (e) {
                if(mainBox)
                    document.body.removeChild(mainBox);

                mainBox     = null;
                imageBox    = null;
                infoBox     = null;
                fnBox       = null;
                sizeBox     = null;
                closeBox    = null;
                imageEl     = null;
                killBox     = null;
                window.removeEventListener('keyup', closeEsc);
            };

            var closeEsc = function (e) {
                if (e.keyCode === 27) {
                    killBox();
                }
            };

            closeBox.addEventListener('click', killBox);
            window.addEventListener('keyup', closeEsc);
            //mainBox.addEventListener('touchstart', killBox);
            //mainBox.addEventListener('click', killBox);

            return mainBox;
        },
        /**
         * Test if the value is a integer number
         * @param value value to test
         * @returns {boolean}
         */
        isInt: function (value) {
            var x;
            if (isNaN(value)) {
                return false;
            }
            x = parseFloat(value);
            return (x | 0) === x;
        },
        /**
         * A small function for parsing file unit size of the form 10M, 2G, 100K
         * @param {String} size the string size
         * @returns {number}
         */
        parseSize: function (size) {
            if (!Utils.isInt(size)) {
                var unit = size.slice(-1);
                if (isNaN(unit)) {
                    size = parseInt(size.replace(unit, ''));//remove the last char
                    switch (unit) {
                        case 'P':
                            size = size * 1024;//1024 or 1000??
                        case 'T':
                            size = size * 1024;
                        case 'G':
                            size = size * 1024;
                        case 'M':
                            size = size * 1024;
                        case 'K':
                            size = size * 1024;
                    }
                }
            }
            return size;
        },
        /**
         * Simple Ajax Post function, will automatically parse JSON if the return string is a valid JSON
         * @param {URL}  url  post URL
         * @param {FormData} data  parameters to post
         * @param {function} cb  function to call on request done
         */
        ajaxPost: function (url, data, cb) {
            var xhr = new XMLHttpRequest();
            if (typeof cb == 'function') {
                this.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {
                        var results = this.responseText;
                        try {
                            results = JSON.parse(this.responseText);
                        } catch (e) {
                            return false;
                        }
                        cb(results);
                        xhr = null;//remove reference
                    }
                };
            }
            xhr.open('POST', url);
            //xhr.setRequestHeader('Cache-Control', 'no-cache');
            //xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');//header
            //xhr.setRequestHeader('Content-Type', 'application/octet-stream');//generic stream header
            xhr.send(data);
        },
        //better log function
        log: function() {
            if(Constants.ENV === 'DEV') {
                var args = Array.prototype.slice.call(arguments, 0);
                var date = new Date();
                var now = ((date.getHours() < 10) ? "0" : "") + date.getHours() + ":" + ((date.getMinutes() < 10) ? "0" : "") + date.getMinutes() + ":" + ((date.getSeconds() < 10) ? "0" : "") + date.getSeconds();
                args.unshift(now);
                console.log.apply(console, args);
            }
        }
    };

    return Utils;
});

/**
 * @file Simple Runner
 * SimpleRunner class, a simple deferred object for handling yes/no callbacks
 * @author Alban Xhaferllari
 * @version 1.0
 * @date 15/08/2015
 */

define( /** @lends SimpleRunner */ 'SimpleRunner',[],function(){

    /**
     * SimpleRunner class, a simple deferred object for handling yes/no callbacks
     * @param scope The scope of run function, normally the object creating the runner
     * @constructor
     */
    var SimpleRunner = function (scope) {
        this._yes = [];
        this._no = [];
        this._always = [];
        this.scope = scope;
    };

    SimpleRunner.prototype = {
        /**
         * Adds callback to the positive return
         * @param cb
         * @returns {SimpleRunner}
         */
        yes: function (cb) {
            this._yes.push(cb);
            return this;
        },
        /**
         * Adds callback to negative return
         * @param cb
         * @returns {SimpleRunner}
         */
        no: function (cb) {
            this._no.push(cb);
            return this;
        },
        /**
         * Callbacks that runs always after the deferred is resolved
         * @param cb
         * @returns {SimpleRunner}
         */
        always: function (cb) {
            this._always.push(cb);
            return this;
        },
        /**
         * Run the selected queue of callbacks
         * @param queue
         * @returns {SimpleRunner}
         */
        run: function (queue) {
            if (this['_' + queue]) {
                //contact the always callbacks to the current one, to run
                var list = this['_' + queue].concat(this._always);
                for (var i = 0; i < list.length; i++) {
                    var fun = list[i];
                    if (fun.fn) {
                        fun.fn.call(fun.scope || this.scope);
                    } else if (typeof fun == 'function') {
                        fun.call(this.scope);
                    }
                }
            }
            return this;
        }
    };
    return SimpleRunner;
});
/**
 * @file File md5 calculation in javascript
 * @author Alban Xhaferllari <albanx@gmail.com>
 * @version 1.0
 * @copyleft
 */
define('FileMd5',['Utils'], /** @lends FileMd5 */ function(Utils) {

    /**
     * File md5 calculation in javascript, uses webworker
     * @param {File} file The file object
     * @constructor
     * @example:
     * var md5Calc = new FileMd5(file);
     * md5Calc.done(function(result){
     *     console.log(result);
     * });
     * md5Calc.start();
     */
    var FileMd5 = function(file){
        var me = this;

        //event listener of onMessage
        var onMessage = function(event){
            var a = event.data;
            if (a.status == 'progress') {
                me._runStack(me._progress, [a.progress]);
            } else if (a.status == "end") {
                me._runStack(me._done, [a.result])._runStack(me._always, [event]);
                me.md5Worker.terminate();
            }
        };

        var onError = function(event) {
            me._runStack(me._error, [event])._runStack(me._always, [event]);
            me.md5Worker.terminate();
        };
        //end private functions

        //create the queue stacks callbacks
        this._done      = [];
        this._error     = [];
        this._always    = [];
        this._progress  = [];

        try {
            //create a html5 WebWorker
            this.md5Worker = Utils.runInBackground(md5Function);//TODO integrate here
            this.md5Worker.onmessage = onMessage;
            this.md5Worker.onerror = onError;
            this.file = file;
        } catch (exp) {
            me._runStack(me._error, [exp])._runStack(me._always, [exp]);
        }
    };

    //public functions
    FileMd5.prototype = {
        done: function(callback, ctx){
            return this._addCallback(callback, ctx, 'done');
        },
        progress: function(callback, ctx){
            return this._addCallback(callback, ctx, 'progress');
        },
        error: function(callback, ctx){
            return this._addCallback(callback, ctx, 'error');
        },
        always: function(callback, ctx){
            return this._addCallback(callback, ctx, 'always');
        },
        _addCallback: function(callback, ctx, queue) {
            if( typeof callback == 'function') this['_'+queue].push({callback: callback, ctx: ctx });
            return this;
        },
        _runStack: function(stack, params) {
            var i = 0,  max = stack.length;
            for (i = 0; i < max; i++) {
                stack[i].callback.apply( stack[i].ctx, params );
            }
            return this;
        },
        start: function(){
            this._startTime = new Date();
            this.md5Worker.postMessage({ file : this.file });
            return this;
        },
        stop: function() {
            this.md5Worker.terminate();
        }
    };

    /**
     * this function is executed in a WebWorker
     * @param data
     */
    function md5Function(data) {
        self.percent = 1;
        var e = self.Crypto = {}, g = e.util = {
            rotl: function (a, b) {
                return a << b | a >>> 32 - b
            },
            rotr: function (a, b) {
                return a << 32 - b | a >>> b
            },
            endian: function (a) {
                if (a.constructor == Number) return g.rotl(a, 8) & 16711935 | g.rotl(a, 24) & 4278255360;
                for (var b = 0; b < a.length; b++) a[b] = g.endian(a[b]);
                return a
            },
            randomBytes: function (a) {
                for (var b = []; a > 0; a--) b.push(Math.floor(Math.random() * 256));
                return b
            },
            bytesToWords: function (a) {
                for (var b = [], c = 0, d = 0; c < a.length; c++, d += 8) b[d >>> 5] |= (a[c] & 255) <<
                24 - d % 32;
                return b
            },
            wordsToBytes: function (a) {
                for (var b = [], c = 0; c < a.length * 32; c += 8) b.push(a[c >>> 5] >>> 24 - c % 32 & 255);
                return b
            },
            bytesToHex: function (a) {
                for (var b = [], c = 0; c < a.length; c++) b.push((a[c] >>> 4).toString(16)), b.push((a[c] & 15).toString(16));
                return b.join("")
            },
            hexToBytes: function (a) {
                for (var b = [], c = 0; c < a.length; c += 2) b.push(parseInt(a.substr(c, 2), 16));
                return b
            },
            bytesToBase64: function (a) {
                if (typeof btoa == "function") return btoa(f.bytesToString(a));
                for (var b = [], c = 0; c < a.length; c += 3)
                    for (var d = a[c] << 16 | a[c + 1] <<
                        8 | a[c + 2], e = 0; e < 4; e++) c * 8 + e * 6 <= a.length * 8 ? b.push("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".charAt(d >>> 6 * (3 - e) & 63)) : b.push("=");
                return b.join("")
            },
            base64ToBytes: function (a) {
                if (typeof atob == "function") return f.stringToBytes(atob(a));
                for (var a = a.replace(/[^A-Z0-9+\/]/ig, ""), b = [], c = 0, d = 0; c < a.length; d = ++c % 4) d != 0 && b.push(("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(a.charAt(c - 1)) & Math.pow(2, -2 * d + 8) - 1) << d * 2 | "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".indexOf(a.charAt(c)) >>>
                6 - d * 2);
                return b
            }
        }, e = e.charenc = {};
        e.UTF8 = {
            stringToBytes: function (a) {
                return f.stringToBytes(a)
            },
            bytesToString: function (a) {
                return decodeURIComponent(f.bytesToString(a))
            }
        };
        var f = e.Binary = {
            stringToBytes: function (a) {
                for (var b = [], c = 0; c < a.length; c++) b.push(a.charCodeAt(c) & 255);
                return b
            },
            bytesToString: function (a) {
                for (var b = [], c = 0; c < a.length; c++) b.push(String.fromCharCode(a[c]));
                return b.join("")
            }
        }

        function FF(b, g, c, a, d, e, f) {
            b = b + (g & c | ~g & a) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function GG(b, g, c, a, d, e, f) {
            b = b + (g & a | c & ~a) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function HH(b, g, c, a, d, e, f) {
            b = b + (g ^ c ^ a) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function II(b, g, c, a, d, e, f) {
            b = b + (c ^ (g | ~a)) + (d >>> 0) + f;
            return (b << e | b >>> 32 - e) + g
        }

        function md5(b, g) {
            for (var c = g[0], a = g[1], d = g[2], e = g[3], f = 0; f < b.length; f += 16) var h = c,
                k = a, m = d, n = e, c = FF(c, a, d, e, b[f + 0], 7, -680876936), e = FF(e, c, a, d, b[f + 1], 12, -389564586), d = FF(d, e, c, a, b[f + 2], 17, 606105819), a = FF(a, d, e, c, b[f + 3], 22, -1044525330), c = FF(c, a, d, e, b[f + 4], 7, -176418897), e = FF(e, c, a, d, b[f + 5], 12, 1200080426), d = FF(d, e, c, a, b[f + 6], 17, -1473231341), a = FF(a, d, e, c, b[f + 7], 22, -45705983), c = FF(c, a, d, e, b[f + 8], 7, 1770035416), e = FF(e, c, a, d, b[f + 9], 12, -1958414417), d = FF(d, e, c, a, b[f + 10], 17, -42063), a = FF(a, d, e, c, b[f + 11], 22, -1990404162),
                c = FF(c, a, d, e, b[f + 12], 7, 1804603682), e = FF(e, c, a, d, b[f + 13], 12, -40341101), d = FF(d, e, c, a, b[f + 14], 17, -1502002290), a = FF(a, d, e, c, b[f + 15], 22, 1236535329), c = GG(c, a, d, e, b[f + 1], 5, -165796510), e = GG(e, c, a, d, b[f + 6], 9, -1069501632), d = GG(d, e, c, a, b[f + 11], 14, 643717713), a = GG(a, d, e, c, b[f + 0], 20, -373897302), c = GG(c, a, d, e, b[f + 5], 5, -701558691), e = GG(e, c, a, d, b[f + 10], 9, 38016083), d = GG(d, e, c, a, b[f + 15], 14, -660478335), a = GG(a, d, e, c, b[f + 4], 20, -405537848), c = GG(c, a, d, e, b[f + 9], 5, 568446438), e = GG(e, c, a, d, b[f + 14], 9, -1019803690), d = GG(d, e, c, a,
                    b[f + 3], 14, -187363961), a = GG(a, d, e, c, b[f + 8], 20, 1163531501), c = GG(c, a, d, e, b[f + 13], 5, -1444681467), e = GG(e, c, a, d, b[f + 2], 9, -51403784), d = GG(d, e, c, a, b[f + 7], 14, 1735328473), a = GG(a, d, e, c, b[f + 12], 20, -1926607734), c = HH(c, a, d, e, b[f + 5], 4, -378558), e = HH(e, c, a, d, b[f + 8], 11, -2022574463), d = HH(d, e, c, a, b[f + 11], 16, 1839030562), a = HH(a, d, e, c, b[f + 14], 23, -35309556), c = HH(c, a, d, e, b[f + 1], 4, -1530992060), e = HH(e, c, a, d, b[f + 4], 11, 1272893353), d = HH(d, e, c, a, b[f + 7], 16, -155497632), a = HH(a, d, e, c, b[f + 10], 23, -1094730640), c = HH(c, a, d, e, b[f + 13], 4,
                    681279174), e = HH(e, c, a, d, b[f + 0], 11, -358537222), d = HH(d, e, c, a, b[f + 3], 16, -722521979), a = HH(a, d, e, c, b[f + 6], 23, 76029189), c = HH(c, a, d, e, b[f + 9], 4, -640364487), e = HH(e, c, a, d, b[f + 12], 11, -421815835), d = HH(d, e, c, a, b[f + 15], 16, 530742520), a = HH(a, d, e, c, b[f + 2], 23, -995338651), c = II(c, a, d, e, b[f + 0], 6, -198630844), e = II(e, c, a, d, b[f + 7], 10, 1126891415), d = II(d, e, c, a, b[f + 14], 15, -1416354905), a = II(a, d, e, c, b[f + 5], 21, -57434055), c = II(c, a, d, e, b[f + 12], 6, 1700485571), e = II(e, c, a, d, b[f + 3], 10, -1894986606), d = II(d, e, c, a, b[f + 10], 15, -1051523), a =
                    II(a, d, e, c, b[f + 1], 21, -2054922799), c = II(c, a, d, e, b[f + 8], 6, 1873313359), e = II(e, c, a, d, b[f + 15], 10, -30611744), d = II(d, e, c, a, b[f + 6], 15, -1560198380), a = II(a, d, e, c, b[f + 13], 21, 1309151649), c = II(c, a, d, e, b[f + 4], 6, -145523070), e = II(e, c, a, d, b[f + 11], 10, -1120210379), d = II(d, e, c, a, b[f + 2], 15, 718787259), a = II(a, d, e, c, b[f + 9], 21, -343485551), c = c + h >>> 0, a = a + k >>> 0, d = d + m >>> 0, e = e + n >>> 0;
            return [c, a, d, e]
        }

        self.md5hash = [1732584193, -271733879, -1732584194, 271733878];

        function updateMd5(b, g, c, a) {
            b = new Uint8Array(b);
            b = Crypto.util.endian(Crypto.util.bytesToWords(b));
            c === a && (g = 8 * (c - g), a *= 8, b[g >>> 5] |= 128 << a % 32, b[(g + 64 >>> 9 << 4) + 14] = a);
            self.md5hash = md5(b, self.md5hash);
        }



        function readBlob(b) {
            var g           = b.file;
            var fileSync    = new FileReaderSync;
            g.slice = g.webkitSlice || g.mozSlice || g.slice;
            for (var fileSize = g.size, e = 0, f = 1048576 > fileSize ? fileSize : 1048576; e < fileSize;) {
                var h = fileSync.readAsArrayBuffer( g.slice(e, f) );
                updateMd5(h, e, f, fileSize);

                e = f;
                f += 1048576;
                if(f > fileSize)  f = fileSize ;

                //monitor progress in percent, with performance wise, only on full percent 1 2 3 ...
                if( Math.ceil( 100 * f / fileSize ) === self.percent ) {
                    postMessage({ status: "progress", progress: self.percent });
                    self.percent++;
                }
            }

            var md5 = Crypto.util.bytesToHex( Crypto.util.wordsToBytes( Crypto.util.endian(self.md5hash) ) );

            //destroy variables
            g = null;
            fileSync = null;

            postMessage({status: "end", result: md5 });
        }

        readBlob(data);
    }


    return FileMd5;
});



/**
 * @file Exif Reader file for JPEGs base on same online library
 * @author Alban Xhaferllari
 * @version 1.0
 */
define('ExifReader',['Utils'], /** @lends ExifReader */ function(Utils){
    /**
     * Exif Reader class
     * @class ExifReader
     * @param {File} file
     * @param {Object} options
     * @returns {ExifReader}
     * @constructor
     */
    var ExifReader = function(file, options) {
        var me = this;
        //default options
        me.options = {
            maxBufferSize: 262144//exif data are stored in the first 256k of the file
        };

        //extend default options
        if( options !== null && typeof options === 'object' ) {
            for( var prop in options ){
                if( options.hasOwnProperty(prop) ) {
                    me.options[prop] = options[prop];
                }
            }
        }

        //create the queue stacks callbacks
        me._done      = [];
        me._error     = [];
        me._always    = [];
        me._progress  = [];
        me.file = Utils.sliceFile( file, 0, me.options.maxBufferSize);
        return this;
    };

    ExifReader.prototype = {
        start: function() {
            var me = this;
            me._runStack(me._progress, ['File reading']);
            var fileReader = new FileReader();
            fileReader.onload = frLoad;
            fileReader.onerror = frError;
            fileReader.onprogress = frProgress;
            fileReader.readAsArrayBuffer( this.file );

            function frLoad(e) {
                var dataView    = new DataView(e.target.result);

                //check if is a valid jpeg
                if ( dataView.getUint8(0) == 0xFF && dataView.getUint8(1) == 0xD8 && dataView.getUint8(2) == 0xFF ) {
                    me._runStack(me._progress, ['jpegData']);
                    var jpegData    = me.readExifJpeg(dataView);

                    me._runStack(me._progress, ['readIPTCJpeg']);
                    var iptcData    = me.readIPTCJpeg(dataView);

                    //run the success callbacks functions
                    me._runStack(me._done, [jpegData, iptcData]);
                }

                me._runStack(me._always, [e]);
            }

            function frError(e) {
                me._runStack(me._error, [e]);
            }

            function frProgress(e) {
                me._runStack(me._progress, [e, 'File reading']);
            }
        },
        stop: function() {
        },
        done: function(callback, ctx){
            return this._addCallback(callback, ctx, 'done');
        },
        progress: function(callback, ctx){
            return this._addCallback(callback, ctx, 'progress');
        },
        error: function(callback, ctx){
            return this._addCallback(callback, ctx, 'error');
        },
        always: function(callback, ctx){
            return this._addCallback(callback, ctx, 'always');
        },
        _addCallback: function(callback, ctx, queue) {
            if( typeof callback == 'function') this['_'+queue].push({callback: callback, ctx: ctx });
            return this;
        },
        _runStack: function(stack, params) {
            var i = 0,  max = stack.length;
            for (i = 0; i < max; i++) {
                stack[i].callback.apply( stack[i].ctx, params );
            }
            return this;
        },

        tags: {
            exif: {
                // version tags
                0x9000: "ExifVersion",             // EXIF version
                0xA000: "FlashpixVersion",         // Flashpix format version

                // colorspace tags
                0xA001: "ColorSpace",              // Color space information tag

                // image configuration
                0xA002: "PixelXDimension",         // Valid width of meaningful image
                0xA003: "PixelYDimension",         // Valid height of meaningful image
                0x9101: "ComponentsConfiguration", // Information about channels
                0x9102: "CompressedBitsPerPixel",  // Compressed bits per pixel

                // user information
                0x927C: "MakerNote",               // Any desired information written by the manufacturer
                0x9286: "UserComment",             // Comments by user

                // related file
                0xA004: "RelatedSoundFile",        // Name of related sound file

                // date and time
                0x9003: "DateTimeOriginal",        // Date and time when the original image was generated
                0x9004: "DateTimeDigitized",       // Date and time when the image was stored digitally
                0x9290: "SubsecTime",              // Fractions of seconds for DateTime
                0x9291: "SubsecTimeOriginal",      // Fractions of seconds for DateTimeOriginal
                0x9292: "SubsecTimeDigitized",     // Fractions of seconds for DateTimeDigitized

                // picture-taking conditions
                0x829A: "ExposureTime",            // Exposure time (in seconds)
                0x829D: "FNumber",                 // F number
                0x8822: "ExposureProgram",         // Exposure program
                0x8824: "SpectralSensitivity",     // Spectral sensitivity
                0x8827: "ISOSpeedRatings",         // ISO speed rating
                0x8828: "OECF",                    // Optoelectric conversion factor
                0x9201: "ShutterSpeedValue",       // Shutter speed
                0x9202: "ApertureValue",           // Lens aperture
                0x9203: "BrightnessValue",         // Value of brightness
                0x9204: "ExposureBias",            // Exposure bias
                0x9205: "MaxApertureValue",        // Smallest F number of lens
                0x9206: "SubjectDistance",         // Distance to subject in meters
                0x9207: "MeteringMode",            // Metering mode
                0x9208: "LightSource",             // Kind of light source
                0x9209: "Flash",                   // Flash status
                0x9214: "SubjectArea",             // Location and area of main subject
                0x920A: "FocalLength",             // Focal length of the lens in mm
                0xA20B: "FlashEnergy",             // Strobe energy in BCPS
                0xA20C: "SpatialFrequencyResponse",    //
                0xA20E: "FocalPlaneXResolution",   // Number of pixels in width direction per FocalPlaneResolutionUnit
                0xA20F: "FocalPlaneYResolution",   // Number of pixels in height direction per FocalPlaneResolutionUnit
                0xA210: "FocalPlaneResolutionUnit",    // Unit for measuring FocalPlaneXResolution and FocalPlaneYResolution
                0xA214: "SubjectLocation",         // Location of subject in image
                0xA215: "ExposureIndex",           // Exposure index selected on camera
                0xA217: "SensingMethod",           // Image sensor type
                0xA300: "FileSource",              // Image source (3 == DSC)
                0xA301: "SceneType",               // Scene type (1 == directly photographed)
                0xA302: "CFAPattern",              // Color filter array geometric pattern
                0xA401: "CustomRendered",          // Special processing
                0xA402: "ExposureMode",            // Exposure mode
                0xA403: "WhiteBalance",            // 1 = auto white balance, 2 = manual
                0xA404: "DigitalZoomRation",       // Digital zoom ratio
                0xA405: "FocalLengthIn35mmFilm",   // Equivalent foacl length assuming 35mm film camera (in mm)
                0xA406: "SceneCaptureType",        // Type of scene
                0xA407: "GainControl",             // Degree of overall image gain adjustment
                0xA408: "Contrast",                // Direction of contrast processing applied by camera
                0xA409: "Saturation",              // Direction of saturation processing applied by camera
                0xA40A: "Sharpness",               // Direction of sharpness processing applied by camera
                0xA40B: "DeviceSettingDescription",    //
                0xA40C: "SubjectDistanceRange",    // Distance to subject

                // other tags
                0xA005: "InteroperabilityIFDPointer",
                0xA420: "ImageUniqueID"            // Identifier assigned uniquely to each image
            },
            tiff: {
                0x0100: "ImageWidth",
                0x0101: "ImageHeight",
                0x8769: "ExifIFDPointer",
                0x8825: "GPSInfoIFDPointer",
                0xA005: "InteroperabilityIFDPointer",
                0x0102: "BitsPerSample",
                0x0103: "Compression",
                0x0106: "PhotometricInterpretation",
                0x0112: "Orientation",
                0x0115: "SamplesPerPixel",
                0x011C: "PlanarConfiguration",
                0x0212: "YCbCrSubSampling",
                0x0213: "YCbCrPositioning",
                0x011A: "XResolution",
                0x011B: "YResolution",
                0x0128: "ResolutionUnit",
                0x0111: "StripOffsets",
                0x0116: "RowsPerStrip",
                0x0117: "StripByteCounts",
                0x0201: "JPEGInterchangeFormat",
                0x0202: "JPEGInterchangeFormatLength",
                0x012D: "TransferFunction",
                0x013E: "WhitePoint",
                0x013F: "PrimaryChromaticities",
                0x0211: "YCbCrCoefficients",
                0x0214: "ReferenceBlackWhite",
                0x0132: "DateTime",
                0x010E: "ImageDescription",
                0x010F: "Make",
                0x0110: "Model",
                0x0131: "Software",
                0x013B: "Artist",
                0x8298: "Copyright"
            },

            GPS: {
                0x0000: "GPSVersionID",
                0x0001: "GPSLatitudeRef",
                0x0002: "GPSLatitude",
                0x0003: "GPSLongitudeRef",
                0x0004: "GPSLongitude",
                0x0005: "GPSAltitudeRef",
                0x0006: "GPSAltitude",
                0x0007: "GPSTimeStamp",
                0x0008: "GPSSatellites",
                0x0009: "GPSStatus",
                0x000A: "GPSMeasureMode",
                0x000B: "GPSDOP",
                0x000C: "GPSSpeedRef",
                0x000D: "GPSSpeed",
                0x000E: "GPSTrackRef",
                0x000F: "GPSTrack",
                0x0010: "GPSImgDirectionRef",
                0x0011: "GPSImgDirection",
                0x0012: "GPSMapDatum",
                0x0013: "GPSDestLatitudeRef",
                0x0014: "GPSDestLatitude",
                0x0015: "GPSDestLongitudeRef",
                0x0016: "GPSDestLongitude",
                0x0017: "GPSDestBearingRef",
                0x0018: "GPSDestBearing",
                0x0019: "GPSDestDistanceRef",
                0x001A: "GPSDestDistance",
                0x001B: "GPSProcessingMethod",
                0x001C: "GPSAreaInformation",
                0x001D: "GPSDateStamp",
                0x001E: "GPSDifferential"
            },
            StringValues: {
                ExposureProgram: {
                    0: "Not defined",
                    1: "Manual",
                    2: "Normal program",
                    3: "Aperture priority",
                    4: "Shutter priority",
                    5: "Creative program",
                    6: "Action program",
                    7: "Portrait mode",
                    8: "Landscape mode"
                },
                MeteringMode: {
                    0: "Unknown",
                    1: "Average",
                    2: "CenterWeightedAverage",
                    3: "Spot",
                    4: "MultiSpot",
                    5: "Pattern",
                    6: "Partial",
                    255: "Other"
                },
                LightSource: {
                    0: "Unknown",
                    1: "Daylight",
                    2: "Fluorescent",
                    3: "Tungsten (incandescent light)",
                    4: "Flash",
                    9: "Fine weather",
                    10: "Cloudy weather",
                    11: "Shade",
                    12: "Daylight fluorescent (D 5700 - 7100K)",
                    13: "Day white fluorescent (N 4600 - 5400K)",
                    14: "Cool white fluorescent (W 3900 - 4500K)",
                    15: "White fluorescent (WW 3200 - 3700K)",
                    17: "Standard light A",
                    18: "Standard light B",
                    19: "Standard light C",
                    20: "D55",
                    21: "D65",
                    22: "D75",
                    23: "D50",
                    24: "ISO studio tungsten",
                    255: "Other"
                },
                Flash: {
                    0x0000: "Flash did not fire",
                    0x0001: "Flash fired",
                    0x0005: "Strobe return light not detected",
                    0x0007: "Strobe return light detected",
                    0x0009: "Flash fired, compulsory flash mode",
                    0x000D: "Flash fired, compulsory flash mode, return light not detected",
                    0x000F: "Flash fired, compulsory flash mode, return light detected",
                    0x0010: "Flash did not fire, compulsory flash mode",
                    0x0018: "Flash did not fire, auto mode",
                    0x0019: "Flash fired, auto mode",
                    0x001D: "Flash fired, auto mode, return light not detected",
                    0x001F: "Flash fired, auto mode, return light detected",
                    0x0020: "No flash function",
                    0x0041: "Flash fired, red-eye reduction mode",
                    0x0045: "Flash fired, red-eye reduction mode, return light not detected",
                    0x0047: "Flash fired, red-eye reduction mode, return light detected",
                    0x0049: "Flash fired, compulsory flash mode, red-eye reduction mode",
                    0x004D: "Flash fired, compulsory flash mode, red-eye reduction mode, return light not detected",
                    0x004F: "Flash fired, compulsory flash mode, red-eye reduction mode, return light detected",
                    0x0059: "Flash fired, auto mode, red-eye reduction mode",
                    0x005D: "Flash fired, auto mode, return light not detected, red-eye reduction mode",
                    0x005F: "Flash fired, auto mode, return light detected, red-eye reduction mode"
                },
                SensingMethod: {
                    1: "Not defined",
                    2: "One-chip color area sensor",
                    3: "Two-chip color area sensor",
                    4: "Three-chip color area sensor",
                    5: "Color sequential area sensor",
                    7: "Trilinear sensor",
                    8: "Color sequential linear sensor"
                },
                SceneCaptureType: {
                    0: "Standard",
                    1: "Landscape",
                    2: "Portrait",
                    3: "Night scene"
                },
                SceneType: {
                    1: "Directly photographed"
                },
                CustomRendered: {
                    0: "Normal process",
                    1: "Custom process"
                },
                WhiteBalance: {
                    0: "Auto white balance",
                    1: "Manual white balance"
                },
                GainControl: {
                    0: "None",
                    1: "Low gain up",
                    2: "High gain up",
                    3: "Low gain down",
                    4: "High gain down"
                },
                Contrast: {
                    0: "Normal",
                    1: "Soft",
                    2: "Hard"
                },
                Saturation: {
                    0: "Normal",
                    1: "Low saturation",
                    2: "High saturation"
                },
                Sharpness: {
                    0: "Normal",
                    1: "Soft",
                    2: "Hard"
                },
                SubjectDistanceRange: {
                    0: "Unknown",
                    1: "Macro",
                    2: "Close view",
                    3: "Distant view"
                },
                FileSource: {
                    3: "DSC"
                },

                Components: {
                    0: "",
                    1: "Y",
                    2: "Cb",
                    3: "Cr",
                    4: "R",
                    5: "G",
                    6: "B"
                }
            }

        },

        /**
         * Read Exif from a array buffer file
         * @param DataView File
         * @returns {*}
         */
        readExifJpeg: function(dataView) {
            var offset = 2;

            while (offset < dataView.byteLength) {
                // we could implement handling for other markers here,
                // but we're only looking for 0xFFE1 for EXIF data
                if (dataView.getUint8(offset + 1) == 225) {
                    return this.readExif(dataView, offset + 4);
                } else {
                    offset += 2 + dataView.getUint16(offset + 2);
                }
            }
            return false;
        },
        readIPTCJpeg: function(dataView) {

            var offset = 2;
            var isFieldSegmentStart = function (dataView, offset) {
                return (
                    dataView.getUint8(offset) === 0x38 &&
                    dataView.getUint8(offset + 1) === 0x42 &&
                    dataView.getUint8(offset + 2) === 0x49 &&
                    dataView.getUint8(offset + 3) === 0x4D &&
                    dataView.getUint8(offset + 4) === 0x04 &&
                    dataView.getUint8(offset + 5) === 0x04
                );
            };

            while (offset < dataView.byteLength) {
                if (isFieldSegmentStart(dataView, offset)) {
                    // Get the length of the name header (which is padded to an even number of bytes)
                    var nameHeaderLength = dataView.getUint8(offset + 7);
                    if (nameHeaderLength % 2 !== 0) nameHeaderLength += 1;
                    // Check for pre photoshop 6 format
                    if (nameHeaderLength === 0) {
                        // Always 4
                        nameHeaderLength = 4;
                    }

                    var startOffset = offset + 8 + nameHeaderLength;
                    var sectionLength = dataView.getUint16(offset + 6 + nameHeaderLength);

                    return this.readIPTCData(dataView, startOffset, sectionLength);
                }

                // Not the marker, continue searching
                offset++;
            }
        },
        readExif: function(dataView, start) {
            //getStringFromDB integrate in object
            if (this.getStringFromDB(dataView, start, 4) != "Exif") {
                return false;
            }

            var bigEnd, tag, gpsData, tiffOffset = start + 6;

            // test for TIFF validity and endianness
            if (dataView.getUint16(tiffOffset) == 0x4949) {
                bigEnd = false;
            } else if (dataView.getUint16(tiffOffset) == 0x4D4D) {
                bigEnd = true;
            } else {
                return false;
            }

            if (dataView.getUint16(tiffOffset + 2, !bigEnd) != 0x002A) {
                return false;
            }

            var firstIFDOffset = dataView.getUint32(tiffOffset + 4, !bigEnd);

            if (firstIFDOffset < 0x00000008) {
                return false;
            }

            var tags = this.readTags(dataView, tiffOffset, tiffOffset + firstIFDOffset, this.tags.tiff, bigEnd);

            if ( tags.ExifIFDPointer ) {
                var exifData = this.readTags(dataView, tiffOffset, tiffOffset + tags.ExifIFDPointer, this.tags.exif, bigEnd);
                for (tag in exifData) {
                    if ( exifData.hasOwnProperty(tag) ) {
                        switch (tag) {
                            case "LightSource" :
                            case "Flash" :
                            case "MeteringMode" :
                            case "ExposureProgram" :
                            case "SensingMethod" :
                            case "SceneCaptureType" :
                            case "SceneType" :
                            case "CustomRendered" :
                            case "WhiteBalance" :
                            case "GainControl" :
                            case "Contrast" :
                            case "Saturation" :
                            case "Sharpness" :
                            case "SubjectDistanceRange" :
                            case "FileSource" :
                                exifData[tag] = this.tags.StringValues[tag][exifData[tag]];
                                break;

                            case "ExifVersion" :
                            case "FlashpixVersion" :
                                exifData[tag] = String.fromCharCode(exifData[tag][0], exifData[tag][1], exifData[tag][2], exifData[tag][3]);
                                break;

                            case "ComponentsConfiguration" :
                                exifData[tag] =
                                    this.tags.StringValues.Components[exifData[tag][0]] +
                                    this.tags.StringValues.Components[exifData[tag][1]] +
                                    this.tags.StringValues.Components[exifData[tag][2]] +
                                    this.tags.StringValues.Components[exifData[tag][3]];
                                break;
                        }
                        tags[tag] = exifData[tag];
                    }
                }
            }

            if (tags.GPSInfoIFDPointer) {
                gpsData = this.readTags(dataView, tiffOffset, tiffOffset + tags.GPSInfoIFDPointer, this.tags.GPS, bigEnd);
                for (tag in gpsData) {
                    switch (tag) {
                        case "GPSVersionID" :
                            gpsData[tag] = gpsData[tag][0] + "." + gpsData[tag][1] + "." + gpsData[tag][2] + "." + gpsData[tag][3];
                            break;
                    }
                    tags[tag] = gpsData[tag];
                }
            }

            return tags;
        },

        readIPTCData: function(dataView, startOffset, sectionLength) {
            var IptcFieldMap = {
                0x78: 'caption',
                0x6E: 'credit',
                0x19: 'keywords',
                0x37: 'dateCreated',
                0x50: 'byline',
                0x55: 'bylineTitle',
                0x7A: 'captionWriter',
                0x69: 'headline',
                0x74: 'copyright',
                0x0F: 'category'
            };

            var data = {};
            var fieldValue, fieldName, dataSize, segmentType, segmentSize;
            var segmentStartPos = startOffset;
            while (segmentStartPos < startOffset + sectionLength) {
                if (dataView.getUint8(segmentStartPos) === 0x1C && dataView.getUint8(segmentStartPos + 1) === 0x02) {
                    segmentType = dataView.getUint8(segmentStartPos + 2);
                    if (segmentType in IptcFieldMap) {
                        dataSize = dataView.getInt16(segmentStartPos + 3);
                        segmentSize = dataSize + 5;
                        fieldName = IptcFieldMap[segmentType];
                        fieldValue = this.getStringFromDB(dataView, segmentStartPos + 5, dataSize);
                        // Check if we already stored a value with this name
                        if (data.hasOwnProperty(fieldName)) {
                            // Value already stored with this name, create multivalue field
                            if (data[fieldName] instanceof Array) {
                                data[fieldName].push(fieldValue);
                            }
                            else {
                                data[fieldName] = [data[fieldName], fieldValue];
                            }
                        }
                        else {
                            data[fieldName] = fieldValue;
                        }
                    }
                }
                segmentStartPos++;
            }
            return data;
        },

        readTags: function(dataView, tiffStart, dirStart, strings, bigEnd) {
            var entries = dataView.getUint16(dirStart, !bigEnd),
                tags = {},
                entryOffset, tag,
                i;

            for (i = 0; i < entries; i++) {
                entryOffset = dirStart + i * 12 + 2;
                tag = strings[dataView.getUint16(entryOffset, !bigEnd)];
                if (!tag) console.log("Unknown tag: " + dataView.getUint16(entryOffset, !bigEnd));
                tags[tag] = this.readTagValue(dataView, entryOffset, tiffStart, dirStart, bigEnd);
            }
            return tags;
        },
        readTagValue: function(file, entryOffset, tiffStart, dirStart, bigEnd) {
            var type = file.getUint16(entryOffset + 2, !bigEnd),
                numValues = file.getUint32(entryOffset + 4, !bigEnd),
                valueOffset = file.getUint32(entryOffset + 8, !bigEnd) + tiffStart,
                offset,
                vals, val, n,
                numerator, denominator;

            switch (type) {
                case 1: // byte, 8-bit unsigned int
                case 7: // undefined, 8-bit byte, value depending on field
                    if (numValues == 1) {
                        return file.getUint8(entryOffset + 8, !bigEnd);
                    } else {
                        offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint8(offset + n);
                        }
                        return vals;
                    }

                case 2: // ascii, 8-bit byte
                    offset = numValues > 4 ? valueOffset : (entryOffset + 8);
                    return this.getStringFromDB(file, offset, numValues - 1);

                case 3: // short, 16 bit int
                    if (numValues == 1) {
                        return file.getUint16(entryOffset + 8, !bigEnd);
                    } else {
                        offset = numValues > 2 ? valueOffset : (entryOffset + 8);
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint16(offset + 2 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 4: // long, 32 bit int
                    if (numValues == 1) {
                        return file.getUint32(entryOffset + 8, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getUint32(valueOffset + 4 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 5:    // rational = two long values, first is numerator, second is denominator
                    if (numValues == 1) {
                        numerator = file.getUint32(valueOffset, !bigEnd);
                        denominator = file.getUint32(valueOffset + 4, !bigEnd);
                        val = new Number(numerator / denominator);
                        val.numerator = numerator;
                        val.denominator = denominator;
                        return val;
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            numerator = file.getUint32(valueOffset + 8 * n, !bigEnd);
                            denominator = file.getUint32(valueOffset + 4 + 8 * n, !bigEnd);
                            vals[n] = new Number(numerator / denominator);
                            vals[n].numerator = numerator;
                            vals[n].denominator = denominator;
                        }
                        return vals;
                    }

                case 9: // slong, 32 bit signed int
                    if (numValues == 1) {
                        return file.getInt32(entryOffset + 8, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getInt32(valueOffset + 4 * n, !bigEnd);
                        }
                        return vals;
                    }

                case 10: // signed rational, two slongs, first is numerator, second is denominator
                    if (numValues == 1) {
                        return file.getInt32(valueOffset, !bigEnd) / file.getInt32(valueOffset + 4, !bigEnd);
                    } else {
                        vals = [];
                        for (n = 0; n < numValues; n++) {
                            vals[n] = file.getInt32(valueOffset + 8 * n, !bigEnd) / file.getInt32(valueOffset + 4 + 8 * n, !bigEnd);
                        }
                        return vals;
                    }
            }
        },

        getStringFromDB: function(buffer, start, length) {
            var outstr = "";
            for (var n = start; n < start + length; n++) {
                outstr += String.fromCharCode(buffer.getUint8(n));
            }
            return outstr;
        },
        pretty: function (data) {
            var a,
                strPretty = "";
            for (a in data) {
                if (data.hasOwnProperty(a)) {
                    if (typeof data[a] == "object") {
                        if (data[a] instanceof Number) {
                            strPretty += a + " : " + data[a] + " [" + data[a].numerator + "/" + data[a].denominator + "]\r\n";
                        } else {
                            strPretty += a + " : [" + data[a].length + " values]\r\n";
                        }
                    } else {
                        strPretty += a + " : " + data[a] + "\r\n";
                    }
                }
            }
            return strPretty;
        }
    };
    return ExifReader;
});
/**
 * @file ExifRestorer
 * @author Alban Xhaferllari
 * @version 1.0
 * @date 29/09/2015 00:04
 * A small utility to preserve the exif during image resize with HTML5 javascript
 * @example <caption>Example usage of the class.</caption>
 *  var exifCopy = new ExifRestorer();
 *  exifCopy.onComplete = function (blobWithExif) {
 *      //some action on complete
 * };
 * exifCopy.restore(originalFile, destinationBlob);
 */
define('ExifRestorer',[], /** @lends ExifRestorer */ function(){
    var ExifRestorer = function(){

        /**
         * Function to bind and call on complete of exif restore
         * @type {null}
         */
        this.onComplete = null;
    };

    ExifRestorer.prototype = {
        /**
         * Main method, the only used as public method
         * Read exif information from a Blob (file) and copy it in the destination Blob (toBlob of any canvas)
         * @param {Blob} fileBlob Source  original file with all information
         * @param {Blob} resizeBlob Resized destination file or any other blob of type image
         */
        restore: function(fileBlob, resizeBlob) {
            var me = this;
            me.readExifData(fileBlob, function(exifData) {
                if(exifData) {
                    var readResized = new FileReader();
                    readResized.onload = function (e) {
                        //read the blob in a DataView
                        var dataFile    = new DataView(e.target.result);

                        //find the point where to insert the exif
                        var exifPoint   = me.findExifIndex(dataFile);
                        var part1 = dataFile.buffer.slice(0, exifPoint);
                        var part2 = dataFile.buffer.slice(exifPoint);
                        if( typeof me.onComplete == 'function') {
                            me.onComplete(new Blob([part1, exifData, part2], {type: resizeBlob.type}));
                        }
                    };
                    readResized.readAsArrayBuffer(resizeBlob);
                } else {
                    me.onComplete(resizeBlob);
                }
            });
        },
        /**
         * Read exif data from the image File and on success calls the second parameter function
         * @param {Blob} file The source image file
         * @param {Function} callback function
         * @returns {FileReader}
         */
        readExifData: function(file, callback) {
            var me = this;
            var fileR = new FileReader();
            fileR.onload = function(e) {
                var fileData    = new DataView(e.target.result);
                var arrayExif   = me.findExifData(fileData);
                callback(arrayExif);
            };
            fileR.readAsArrayBuffer(file);
            return fileR;
        },
        /**
         * Find the index in the binary data file of the exif
         * @param {ArrayBuffer} arrayBuffer
         * @returns {number}
         */
        findExifIndex: function(arrayBuffer){
            var head = 3;
            //scan the array buffer for the correct byte
            while (head < arrayBuffer.byteLength) {
                if (arrayBuffer.getUint8(head) == 255) {
                    return head;
                }
                head++;
            }
            return 0;
        },
        /**
         * Find the exif block of data from a arrayBuffer
         * @param {DataView} rawImageArray
         * @returns {ArrayBuffer}
         */
        findExifData: function(rawImageArray) {
            var head = 0;

            while (head < rawImageArray.byteLength) {
                if (rawImageArray.getUint8(head) == 255 && rawImageArray.getUint8(head + 1) == 218) {
                    break;
                }

                if (rawImageArray.getUint8(head) == 255 && rawImageArray.getUint8(head + 1) == 216) {
                    head += 2;
                } else {
                    var endPoint = head + rawImageArray.getUint8(head+2) * 256 + rawImageArray.getUint8(head + 3) + 2;
                    if (rawImageArray.getUint8(head) == 255 && rawImageArray.getUint8(head+1) == 225) //(ff e1)
                    {
                        return rawImageArray.buffer.slice(head, endPoint);
                    }

                    head = endPoint;
                }
            }
            return false;
        }
    };
    return ExifRestorer;
});
/**
 * @author Created by Alban on 12/07/2015.
 * @file ImageScale for Javascript with different quality
 * Derived from Pica Library, the fastest js library for image resize
 * https://github.com/nodeca/pica
 * Use of WebWorkers for performance
 * @version 1.0
 */
define('ImageScale',['Utils', 'ExifRestorer'], /** @lends ImageScale */ function(Utils, ExifRestorer){
    /**
     * Pollyfill based on toDataURL
     * https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob
     */
    if (!HTMLCanvasElement.prototype.toBlob) {
        Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
            value: function (callback, type, quality) {

                var binStr = atob( this.toDataURL(type, quality).split(',')[1] ),
                    len = binStr.length,
                    arr = new Uint8Array(len);

                for (var i = 0; i < len; i++) {
                    arr[i] = binStr.charCodeAt(i);
                }

                callback( new Blob( [arr], {type: type || 'image/jpeg'} ) );
            }
        });
    }

    /**
     * Image Scale class
     * @param {File} file The DOM file selected from a input or a drag and drop
     * @param {Object} options Options defining the scale properties
     * @param {Object} [options.maxWidth=0] Maximum  width for the resize, it will be scaled propotionally keeping aspect
     * ratio
     * @param {Object} [options.maxHeight=0] Maximum height for the resize, combined with the maxWidth the image will
     * keep aspect ratio
     * @param {Object} [options.allowOverResize=false] If true the scale will be scaled over it's original sizes
     * @param {Object} [options.outputFormat=false] Output format of the scaled image, can be either jpg or png
     * @param {Object} [options.outputQuality=1] Output quality of the resized image
     * @constructor
     * @example <caption>Example usage of the class.</caption>
     *  var scale = new ImageScale(file, options);
     *  scale.done(function (result) {
     *      console.log('resized image', result);
     *  }).progress(function (percent) {
     *       console.log('resizing image', percent);
     *  });
     *  scale.start(); //start the scale
     */
    var ImageScale = function(file, options){
        var me = this;

        //default options
        me.options = {
            maxWidth:           0,
            maxHeight:          0,
            allowOverResize:    false,
            outputFormat:       false,
            outputQuality:      1,
            scaleMethod:        3,
            keepExif:           false,
            keepAspectRatio:    true,
            unsharpAmount:      0,
            unsharpThreshold:   0,
            alpha:              true
        };

        //extend default options
        if( options !== null && typeof options === 'object' ) {
            for( var prop in options ){
                if(options.hasOwnProperty(prop)) {
                    me.options[prop] = options[prop];
                }
            }
        }

        //create a html5 WebWorker
        me.file       = file;
        me.fileExt    = file.name.split('.').pop().toLowerCase();

        //create the queue stacks callbacks
        //this is a standard way to make some plugins
        me._done      = [];
        me._error     = [];
        me._always    = [];
        me._progress  = [];
    };

    /**
     * Public functions
     * @type {{done: Function, progress: Function, error: Function, always: Function, _addCallback: Function, _runStack: Function, start: Function, stop: Function, _validateOptions: Function, _readImage: Function, _onProgressRead: Function, _onDoneRead: Function, _scale: Function, _createCanvas: Function, _startScale: Function, _onMessageScale: Function, _onErrorRead: Function, _onErrorImageLoad: Function, _onErrorScale: Function, _onError: Function}}
     */
    ImageScale.prototype = {
        /**
         * Adds callbacks function that will be run on the end of the resize
         * @param {Function} callback The callback function
         * @param {Context} ctx Scope under which to run the callback function
         * @returns {*}
         */
        done: function(callback, ctx){
            return this._addCallback(callback, ctx, 'done');
        },
        /**
         * Adds callbacks function that will be run during the resize
         * The progress function will run 100 times, 1 for each percent
         * @param {Function} callback The callback function
         * @param {Context} ctx Scope under which to run the callback function
         * @returns {*}
         */
        progress: function(callback, ctx){
            return this._addCallback(callback, ctx, 'progress');
        },
        /**
         * Adds callbacks function that will be run if there is any error
         * @param {Function} callback The callback function
         * @param {Context} ctx Scope under which to run the callback function
         * @returns {*}
         */
        error: function(callback, ctx){
            return this._addCallback(callback, ctx, 'error');
        },
        /**
         * Callbacks added to this queue will be run always at the end of the resize even it returns error
         * @param {Function} callback The callback function
         * @param {Context} ctx Scope under which to run the callback function
         * @returns {*}
         */
        always: function(callback, ctx){
            return this._addCallback(callback, ctx, 'always');
        },
        /**
         * Private function that adds the callback function to the queue
         * @param {Function} callback The callback function
         * @param {Context} ctx scope under which to run the callback function
         * @param {String} queue Queue containing the callback
         * @returns {ImageScale}
         * @private
         */
        _addCallback: function(callback, ctx, queue) {
            if( typeof callback == 'function') this['_'+queue].push({callback: callback, ctx: ctx });
            return this;
        },
        _runStack: function(stack, params) {
            var i = 0,  max = stack.length;
            for (i = 0; i < max; i++) {
                stack[i].callback.apply( stack[i].ctx, params);
            }
            return this;
        },
        start: function() {
            if ( this._validateOptions() ) {
                return this._readImage();
            }
            return this._onError( 'Settings not valid', null );
        },
        stop: function() {
            if(this.worker) {
                this.worker.terminate();
            }
        },
        //private methods
        _validateOptions: function() {
            var options = this.options;
            //has valid size number && has at least one of the dimensions set && is a valid blob or file
            return ( !isNaN(options.maxWidth) || !isNaN(options.maxHeight) ) &&
                (options.maxWidth > 0 || options.maxHeight > 0) &&
                ( this.file.toString() === '[object File]' || this.file.toString() === '[object Blob]');
        },
        /**
         * Read the file to a binary or base64 string for canvas
         * @returns {ImageScale}
         * @private
         */
        _readImage: function() {
            var URL = window.URL || window.webkitURL;
            if( URL && URL.createObjectURL ){
                this._onDoneRead({
                    target : {
                        result: URL.createObjectURL( this.file )
                    },
                    callback: function() {
                        URL.revokeObjectURL( this.file ) //this will free some memory
                    }
                });
            } else {
                var reader = new FileReader();
                reader.onprogress = this._onProgressRead.bind(this);
                reader.onerror = this._onErrorRead.bind(this);
                reader.onload = this._onDoneRead.bind(this);
                reader.readAsDataURL(this.file);//start reading process
            }
            return this;
        },
        /**
         * Function handler for the progress event for the read function
         * @param e Event read file event
         * @private
         */
        _onProgressRead: function(e) {
            var progress = Math.round(e.loaded * 100 / e.total);
            this._runStack(this._progress, [progress, 'Reading file', e]);
        },
        /**
         * Called when file has been read
         * @param event
         * @private
         */
        _onDoneRead: function(event) {
            var img 	= new Image();
            var me      = this;
            img.onload  = function() {
                me._scale(this);
                if( event.callback ) {
                    event.callback();
                }
            };
            img.onerror = me._onErrorImageLoad.bind(me);
            img.src 	= event.target.result;
        },
        /**
         * Helper function to create a canvas element
         * @param width
         * @param height
         * @returns {Element}
         * @private
         */
        _createCanvas: function(width, height) {
            var canvas 		= document.createElement('canvas');
            canvas.width 	= width;
            canvas.height 	= height;
            canvas.setAttribute('width', width);
            canvas.setAttribute('height', height);
            return canvas;
        },
        _scale: function(img) {
            //calculate the correct ratio for resize
            var me          = this;
            var width 	    = img.width;
            var height 	    = img.height;
            var maxWidth    = me.options.maxWidth;
            var maxHeight   = me.options.maxHeight;
            var overResize  = me.options.overResize;
            var newWidth    = 0;
            var newHeight   = 0;

            if(me.options.keepAspectRatio) {
                //calculate the correct fit ratio
                var r1 = maxWidth / width;
                var r2 = maxHeight / height;
                var ratio = 0;
                if (r1 > 0 && r2 > 0) {
                    ratio = Math.min(r1, r2);
                } else if (r1 > 0) {
                    ratio = r1;
                } else if (r2 > 0) {
                    ratio = r2;
                }

                //calculate scale to fit in the given sizes
                newWidth = Math.round(width * ratio);
                newHeight = Math.round(height * ratio);
            } else {
                newWidth = maxWidth;
                newHeight = maxHeight;
            }

            //avoid resizing image over the real size
            if( !overResize && (newWidth > img.width || newHeight > img.height) ){
                Utils.log('This image will not be resized');
                this._onError( 'Resize image is bigger than original. AllowResize option disabled.', null );
            } else {
                Utils.log('New image sizes: ', newWidth, newHeight);
                var srcCanvas   = me._createCanvas(width, height);
                var srcCtx      = srcCanvas.getContext('2d');
                srcCtx.drawImage(img, 0, 0, width, height);
                var srcData     = srcCtx.getImageData(0, 0, width, height).data;
                var opts = {
                    width:      width,
                    height:     height,
                    newWidth:   newWidth,
                    newHeight:  newHeight,
                    ratio:      ratio,
                    quality:    3,
                    srcData:    srcData,
                    scaleMethod:        me.options.scaleMethod,
                    unsharpThreshold:   me.options.unsharpThreshold,
                    unsharpAmount:      me.options.unsharpAmount,
                    alpha:              me.options.alpha
                };
                this.worker = this._startScale(img, opts);
            }

            img = null;
            return this;
        },

        _startScale: function(img, opts) {
            //get the worker
            var worker = Utils.runInBackground(resize);
            if(worker) {
                worker.onmessage    = this._onMessageScale.bind(this);
                worker.onerror      = this._onErrorScale.bind(this);
                worker.postMessage(opts);//Make the worker start work :) , [ opts.srcData.buffer ]
                img = null;
                return worker;
            }
            return null;
        },
        _onMessageScale: function(event) {
            var a   = event.data;
            var me  = this;
            if (a.status == 'progress') {
                me._runStack(me._progress, [a.progress, 'Scale progress']);
            } else if (a.status == 'end') {
                me._runStack(me._progress, [a.progress, 'Saving...']);

                //setting format and quality
                var format      = me.options.outputFormat;
                var quality     = me.options.outputQuality;
                var output		= me.fileExt == 'png' ? 'image/png' : 'image/jpeg';//by default output is same as source image
                //if format is forced by the user then change the file name
                if ( format ) {
                    output = format == 'png' ? 'image/png' : 'image/jpeg';
                }

                //saving to file/blob
                var dstCanvas   = me._createCanvas(a.newWidth, a.newHeight);
                var dstCtx      = dstCanvas.getContext('2d');
                var dstImageData= dstCtx.getImageData(0, 0, a.newWidth, a.newHeight);
                var dstData     = dstImageData.data;
                // IE ImageData can return old-style CanvasPixelArray
                // without .set() method. Copy manually for such case.
                if (dstData.set) {
                    dstData.set(a.imageData);
                } else {
                    var i, l;
                    for (i = 0, l = a.imageData.length; i < l; i++) {
                        dstData[i] = a.imageData[i];
                    }
                }
                dstCanvas.getContext('2d').putImageData(dstImageData, 0, 0);

                //convert to blob and call the callbacks
                dstCanvas.toBlob(function(blob) {

                    //check if we want to keep the Exif
                    if(me.options.keepExif) {
                        var exifCopy = new ExifRestorer();
                        exifCopy.onComplete = function (blobWithExif) {
                            //run the callbacks binding
                            me._runStack(me._done, [blobWithExif, event])._runStack(me._always, [blobWithExif, event]);
                        };
                        exifCopy.restore(me.file, blob);
                    } else {
                        me._runStack(me._done, [blob, event])._runStack(me._always, [blob, event]);
                    }

                    //remove reference
                    me._dstCanvas = null;
                }, output, quality);
            }
        },
        _onErrorRead: function(e) {
            return this._onError( 'File read error', e);
        },
        _onErrorImageLoad: function(e){
            return this._onError( 'Image scale error', e);
        },
        _onErrorScale: function(event) {
            return this._onError('Scale error', event);
        },
        _onError: function(msg, event) {
            return this._runStack(this._error, [msg, event])._runStack(this._always, [event]);
        }
    };


    /**
     * Resize function that is handle by a webworker
     * @param options
     */
    function resize(options) {

        function clampTo8(i) { return i < 0 ? 0 : (i > 255 ? 255 : i); }

        // Convert image to greyscale, 16bits FP result (8.8)
        //
        function greyscale(src, srcW, srcH) {
            var size = srcW * srcH;
            var result = new Uint16Array(size); // We don't use sign, but that helps to JIT
            var i, srcPtr;

            for (i = 0, srcPtr = 0; i < size; i++) {
                result[i] = (src[srcPtr + 2] * 7471       // blue
                    + src[srcPtr + 1] * 38470      // green
                    + src[srcPtr] * 19595) >>> 8;  // red
                srcPtr = (srcPtr + 4)|0;
            }

            return result;
        }


        // Apply unsharp mask to src
        //
        // NOTE: radius is ignored to simplify gaussian blur calculation
        // on practice we need radius 0.3..2.0. Use 1.0 now.
        //
        function unsharp(src, srcW, srcH, amount, radius, threshold) {
            var x, y, c, diff = 0, corr, srcPtr;

            // Normalized delta multiplier. Expect that:
            var AMOUNT_NORM = Math.floor(amount * 256 / 50);

            // Convert to grayscale:
            //
            // - prevent color drift
            // - speedup blur calc
            //
            var gs = greyscale(src, srcW, srcH);
            var blured = blur(gs, srcW, srcH, 1);
            var fpThreshold = threshold << 8;
            var gsPtr = 0;

            for (y = 0; y < srcH; y++) {
                for (x = 0; x < srcW; x++) {

                    // calculate brightness blur, difference & update source buffer

                    diff = gs[gsPtr] - blured[gsPtr];

                    // Update source image if thresold exceeded
                    if (Math.abs(diff) > fpThreshold) {
                        // Calculate correction multiplier
                        corr = 65536 + ((diff * AMOUNT_NORM) >> 8);
                        srcPtr = gsPtr * 4;

                        c = src[srcPtr];
                        src[srcPtr++] = clampTo8((c * corr) >> 16);
                        c = src[srcPtr];
                        src[srcPtr++] = clampTo8((c * corr) >> 16);
                        c = src[srcPtr];
                        src[srcPtr] = clampTo8((c * corr) >> 16);
                    }

                    gsPtr++;

                } // end row
            } // end column
        }


        /***
         * Blur Functions
         * @type {Uint8Array}
         * @private
         */
        var _blurKernel = new Uint8Array([
            1, 2, 1,
            2, 4, 2,
            1, 2, 1
        ]);
        var _bkHalf     = Math.floor( Math.floor(Math.sqrt(_blurKernel.length)) / 2);
        var _bkWsum     = 0;
        for (var wc=0; wc < _blurKernel.length; wc++) { _bkWsum += _blurKernel[wc]; }

        function blurPoint(gs, x, y, srcW, srcH) {
            var bx, by, sx, sy, w, wsum, br;
            var bPtr = 0;
            var blurKernel = _blurKernel;
            var bkHalf = _bkHalf;

            wsum = 0; // weight sum to normalize result
            br   = 0;

            if (x >= bkHalf && y >= bkHalf && x + bkHalf < srcW && y + bkHalf < srcH) {
                for (by = 0; by < 3; by++) {
                    for (bx = 0; bx < 3; bx++) {
                        sx = x + bx - bkHalf;
                        sy = y + by - bkHalf;

                        br += gs[sx + sy * srcW] * blurKernel[bPtr++];
                    }
                }
                return (br - (br % _bkWsum)) / _bkWsum;
            }

            for (by = 0; by < 3; by++) {
                for (bx = 0; bx < 3; bx++) {
                    sx = x + bx - bkHalf;
                    sy = y + by - bkHalf;

                    if (sx >= 0 && sx < srcW && sy >= 0 && sy < srcH) {
                        w = blurKernel[bPtr];
                        wsum += w;
                        br += gs[sx + sy * srcW] * w;
                    }
                    bPtr++;
                }
            }
            return ((br - (br % wsum)) / wsum)|0;
        }

        function blur(src, srcW, srcH/*, radius*/) {
            var x, y,
                output = new Uint16Array(src.length);

            for (x = 0; x < srcW; x++) {
                for (y = 0; y < srcH; y++) {
                    output[y * srcW + x] = blurPoint(src, x, y, srcW, srcH);
                }
            }

            return output;
        }

        // Precision of fixed FP values
        var FIXED_FRAC_BITS = 14;
        var FIXED_FRAC_VAL  = 1 << FIXED_FRAC_BITS;
        function toFixedPoint(num) { return Math.floor(num * FIXED_FRAC_VAL); }


        // Calculate convolution filters for each destination point,
        // and pack data to Int16Array:
        //
        // [ shift, length, data..., shift2, length2, data..., ... ]
        //
        // - shift - offset in src image
        // - length - filter length (in src points)
        // - data - filter values sequence
        //
        //
        // Presets for quality 0..3. Filter functions + window size
        //
        var FILTER_INFO = [
            { // Nearest neibor (Box)
                win: 0.5,
                filter: function (x) {
                    return (x >= -0.5 && x < 0.5) ? 1.0 : 0.0;
                }
            },
            { // Hamming
                win: 1.0,
                filter: function (x) {
                    if (x <= -1.0 || x >= 1.0) { return 0.0; }
                    if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
                    var xpi = x * Math.PI;
                    return ((Math.sin(xpi) / xpi) *  (0.54 + 0.46 * Math.cos(xpi / 1.0)));
                }
            },
            { // Lanczos, win = 2
                win: 2.0,
                filter: function (x) {
                    if (x <= -2.0 || x >= 2.0) { return 0.0; }
                    if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
                    var xpi = x * Math.PI;
                    return (Math.sin(xpi) / xpi) * Math.sin(xpi / 2.0) / (xpi / 2.0);
                }
            },
            { // Lanczos, win = 3
                win: 3.0,
                filter: function (x) {
                    if (x <= -3.0 || x >= 3.0) { return 0.0; }
                    if (x > -1.19209290E-07 && x < 1.19209290E-07) { return 1.0; }
                    var xpi = x * Math.PI;
                    return (Math.sin(xpi) / xpi) * Math.sin(xpi / 3.0) / (xpi / 3.0);
                }
            }
        ];

        function createFilters(quality, srcSize, destSize) {

            if(isNaN(quality)) quality = 3;
            var filterFunction = FILTER_INFO[quality].filter;

            var scale         = destSize / srcSize;
            var scaleInverted = 1.0 / scale;
            var scaleClamped  = Math.min(1.0, scale); // For upscale

            // Filter window (averaging interval), scaled to src image
            var srcWindow = FILTER_INFO[quality].win / scaleClamped;

            var destPixel, srcPixel, srcFirst, srcLast, filterElementSize,
                floatFilter, fxpFilter, total, fixedTotal, pxl, idx, floatVal, fixedVal;
            var leftNotEmpty, rightNotEmpty, filterShift, filterSize;

            var maxFilterElementSize = Math.floor((srcWindow + 1) * 2 );
            var packedFilter    = new Int16Array((maxFilterElementSize + 2) * destSize);
            var packedFilterPtr = 0;


            // For each destination pixel calculate source range and built filter values
            for (destPixel = 0; destPixel < destSize; destPixel++) {

                // Scaling should be done relative to central pixel point
                srcPixel = (destPixel + 0.5) * scaleInverted;

                srcFirst = Math.max(0, Math.floor(srcPixel - srcWindow));
                srcLast  = Math.min(srcSize - 1, Math.ceil(srcPixel + srcWindow));

                filterElementSize = srcLast - srcFirst + 1;
                floatFilter = new Float32Array(filterElementSize);
                fxpFilter = new Int16Array(filterElementSize);

                total = 0.0;

                // Fill filter values for calculated range
                for (pxl = srcFirst, idx = 0; pxl <= srcLast; pxl++, idx++) {
                    floatVal = filterFunction(((pxl + 0.5) - srcPixel) * scaleClamped);
                    total += floatVal;
                    floatFilter[idx] = floatVal;
                }

                // Normalize filter, convert to fixed point and accumulate conversion error
                fixedTotal = 0;

                for (idx = 0; idx < floatFilter.length; idx++) {
                    fixedVal = toFixedPoint(floatFilter[idx] / total);
                    fixedTotal += fixedVal;
                    fxpFilter[idx] = fixedVal;
                }

                // Compensate normalization error, to minimize brightness drift
                fxpFilter[destSize >> 1] += toFixedPoint(1.0) - fixedTotal;

                //
                // Now pack filter to useable form
                //
                // 1. Trim heading and tailing zero values, and compensate shitf/length
                // 2. Put all to single array in this format:
                //
                //    [ pos shift, data length, value1, value2, value3, ... ]
                //

                leftNotEmpty = 0;
                while (leftNotEmpty < fxpFilter.length && fxpFilter[leftNotEmpty] === 0) {
                    leftNotEmpty++;
                }

                if (leftNotEmpty < fxpFilter.length) {
                    rightNotEmpty = fxpFilter.length - 1;
                    while (rightNotEmpty > 0 && fxpFilter[rightNotEmpty] === 0) {
                        rightNotEmpty--;
                    }

                    filterShift = srcFirst + leftNotEmpty;
                    filterSize = rightNotEmpty - leftNotEmpty + 1;

                    packedFilter[packedFilterPtr++] = filterShift; // shift
                    packedFilter[packedFilterPtr++] = filterSize; // size

                    packedFilter.set(fxpFilter.subarray(leftNotEmpty, rightNotEmpty + 1), packedFilterPtr);
                    packedFilterPtr += filterSize;
                } else {
                    // zero data, write header only
                    packedFilter[packedFilterPtr++] = 0; // shift
                    packedFilter[packedFilterPtr++] = 0; // size
                }
            }
            return packedFilter;
        }

        // Convolve image in horizontal directions and transpose output. In theory,
        // transpose allow:
        //
        // - use the same convolver for both passes (this fails due different
        //   types of input array and temporary buffer)
        // - making vertical pass by horisonltal lines inprove CPU cache use.
        //
        // But in real life this doesn't work :)
        //
        function convolveHorizontally(src, dest, srcW, srcH, destW, filters) {

            var r, g, b, a;
            var filterPtr, filterShift, filterSize;
            var srcPtr, srcY, destX, filterVal;
            var srcOffset = 0, destOffset = 0;

            // For each row
            for (srcY = 0; srcY < srcH; srcY++) {
                filterPtr  = 0;

                // Apply precomputed filters to each destination row point
                for (destX = 0; destX < destW; destX++) {
                    // Get the filter that determines the current output pixel.
                    filterShift = filters[filterPtr++];
                    filterSize  = filters[filterPtr++];

                    srcPtr = (srcOffset + (filterShift * 4))|0;

                    r = g = b = a = 0;

                    // Apply the filter to the row to get the destination pixel r, g, b, a
                    for (; filterSize > 0; filterSize--) {
                        filterVal = filters[filterPtr++];

                        // Use reverse order to workaround deopts in old v8 (node v.10)
                        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
                        a = (a + filterVal * src[srcPtr + 3])|0;
                        b = (b + filterVal * src[srcPtr + 2])|0;
                        g = (g + filterVal * src[srcPtr + 1])|0;
                        r = (r + filterVal * src[srcPtr])|0;
                        srcPtr = (srcPtr + 4)|0;
                    }

                    // Bring this value back in range. All of the filter scaling factors
                    // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
                    dest[destOffset + 3] = clampTo8(a >> FIXED_FRAC_BITS);
                    dest[destOffset + 2] = clampTo8(b >> FIXED_FRAC_BITS);
                    dest[destOffset + 1] = clampTo8(g >> FIXED_FRAC_BITS);
                    dest[destOffset]     = clampTo8(r >> FIXED_FRAC_BITS);
                    destOffset = (destOffset + srcH * 4)|0;
                }

                destOffset = ((srcY + 1) * 4)|0;
                srcOffset  = ((srcY + 1) * srcW * 4)|0;
            }
        }

        // Technically, convolvers are the same. But input array and temporary
        // buffer can be of different type (especially, in old browsers). So,
        // keep code in separate functions to avoid deoptimizations & speed loss.

        function convolveVertically(src, dest, srcW, srcH, destW, filters) {

            var r, g, b, a;
            var filterPtr, filterShift, filterSize;
            var srcPtr, srcY, destX, filterVal;
            var srcOffset = 0, destOffset = 0;

            // For each row
            for (srcY = 0; srcY < srcH; srcY++) {
                filterPtr  = 0;

                // Apply precomputed filters to each destination row point
                for (destX = 0; destX < destW; destX++) {
                    // Get the filter that determines the current output pixel.
                    filterShift = filters[filterPtr++];
                    filterSize  = filters[filterPtr++];

                    srcPtr = (srcOffset + (filterShift * 4))|0;

                    r = g = b = a = 0;

                    // Apply the filter to the row to get the destination pixel r, g, b, a
                    for (; filterSize > 0; filterSize--) {
                        filterVal = filters[filterPtr++];

                        // Use reverse order to workaround deopts in old v8 (node v.10)
                        // Big thanks to @mraleph (Vyacheslav Egorov) for the tip.
                        a = (a + filterVal * src[srcPtr + 3])|0;
                        b = (b + filterVal * src[srcPtr + 2])|0;
                        g = (g + filterVal * src[srcPtr + 1])|0;
                        r = (r + filterVal * src[srcPtr])|0;
                        srcPtr = (srcPtr + 4)|0;
                    }

                    // Bring this value back in range. All of the filter scaling factors
                    // are in fixed point with FIXED_FRAC_BITS bits of fractional part.
                    dest[destOffset + 3] = clampTo8(a >> FIXED_FRAC_BITS);
                    dest[destOffset + 2] = clampTo8(b >> FIXED_FRAC_BITS);
                    dest[destOffset + 1] = clampTo8(g >> FIXED_FRAC_BITS);
                    dest[destOffset]     = clampTo8(r >> FIXED_FRAC_BITS);
                    destOffset = (destOffset + srcH * 4)|0;
                }

                destOffset = ((srcY + 1) * 4)|0;
                srcOffset  = ((srcY + 1) * srcW * 4)|0;
            }
        }


        function resetAlpha(dst, width, height) {
            var ptr = 3, len = (width * height * 4)|0;
            while (ptr < len) { dst[ptr] = 0xFF; ptr = (ptr + 4)|0; }
        }

        function doScale(options) {
            postMessage({ status: "progress", progress: 0 });
            var src     = options.srcData;
            var srcW    = options.width;
            var srcH    = options.height;
            var destW   = Math.round(options.newWidth);
            var destH   = Math.round(options.newHeight);
            var dest    = new Uint8Array(destW * destH * 4);
            var quality = !options.scaleMethod ? 3 : options.scaleMethod;
            var alpha   = options.alpha || false;
            var unsharpAmount = options.unsharpAmount === undefined ? 0 : (options.unsharpAmount | 0);
            var unsharpThreshold = options.unsharpThreshold === undefined ? 0 : (options.unsharpThreshold | 0);

            if (srcW < 1 || srcH < 1 || destW < 1 || destH < 1) {
                return false;
            }
            postMessage({ status: "progress", progress: 10 });

            var filtersX = createFilters(quality, srcW, destW);
            postMessage({ status: "progress", progress: 20 });

            var filtersY = createFilters(quality, srcH, destH);
            postMessage({ status: "progress", progress: 30 });

            var tmp = new Uint8Array(destW * srcH * 4);
            // To use single function we need src & tmp of the same type.
            // But src can be CanvasPixelArray, and tmp - Uint8Array. So, keep
            // vertical and horizontal passes separately to avoid deoptimization.


            convolveHorizontally(src, tmp, srcW, srcH, destW, filtersX);
            postMessage({ status: "progress", progress: 50 });

            convolveVertically(tmp, dest, srcH, destW, destH, filtersY);
            postMessage({ status: "progress", progress: 70 });
            // That's faster than doing checks in convolver.
            // !!! Note, canvas data is not premultipled. We don't need other
            // alpha corrections.

            if (!alpha) {
                resetAlpha(dest, destW, destH);
                postMessage({ status: "progress", progress: 80 });
            }

            if (unsharpAmount) {
                unsharp(dest, destW, destH, unsharpAmount, 1.0, unsharpThreshold);
                postMessage({ status: "progress", progress: 90 });
            }

            postMessage({ status: "progress", progress: 100 });
            return dest;
        }


        //start the scale
        var result = doScale(options);
        postMessage({ status: "end", imageData: result, progress: 0, newWidth: options.newWidth, newHeight: options.newHeight });
    }

    return ImageScale;
});
/**
 * @file File Object Class
 * keeps files information, upload the file and updates status
 * @author Alban Xhaferllari
 * @version 1.0
 */
define('FileObject',['Constants', 'Utils', 'SimpleRunner', 'i18n', 'FileMd5', 'ExifReader', 'ImageScale'], /** @lends FileObject */
function (Constants, Utils, SimpleRunner, _, FileMd5, ExifReader, ImageScale) {
    'use strict';
    /**
     * FileObject class holds file logic and file upload
     * @class FileObject
     * @param {HTMLElement} file The file object created by the DOM (not the input)
     * @param {String} fileId a unique file id in queue generated by queue manager
     * @param {RealUploader} AU the queue manager
     * @constructor
     */
    var FileObject = function(file, fileId, AU) {
        var me = this;
        //File properties
        me.file       = file;                 //real file object
        me.name       = file.name;            //name of file
        me.size       = file.size;    		//size of file
        me.ext        = file.extension;   	//file extension
        me.fileId     = fileId;               //unique id  for the file
        me.tempFileName = null;               //temp file name used for upload, generated on server side
        me.xhr    	= null; 			    //xmlhttprequest object or form
        me.info   	= null; 			    //info about upload status
        me.extraInfo 	= null; 			    //info about upload status
        me.status     = Constants.AX_IDLE; 	//status -1 error, 0 idle 1 done, 2 uploading, 3 check, 4 ready
        me.AU         = AU; 				    //RealUploader object
        me.config     = AU.config;            //master configuration
        me.exifData   = null;                 //exif information of JPEG file
        me.md5    	= '';                   //md5 of file calculated with javascript
        me.disabled   = false;			    //if disabled cannot be uploaded
        me.ready  	= false;                //boolean telling when file is ready for upload
        me.requestDuration = 0;               //medium request duration
        me.currentFun = null;                 //current running pre-upload function
        me.dom        = {};                   //contains references to dom template objects
        me.imgCls     = '';                   //variable for keep the orientation of file
        me.checkSum   = {};                   //checksum information about me file

        //temp variables
        me.currentByte    = 0; 	            //current uploaded byte
        me.loading_bytes 	= 0;
        me.temp_bytes 	= 0;
        me._preUploadFun  = [];
        me.speedInterval  = null;             //interval handling the bandwidth statics
        me.init();
    };

    FileObject.prototype = {
        /**
         * The initialize function of the class, calls all the other functions
         * @returns {FileObject} returns the instance for the chaining
         */
        init: function() {
            var me = this;
            //visual part
            me.renderHtml();

            //bind events
            me.bindEvents();

            //bind file calculation, operation, most of case heavy operations using WebWorkers
            //for the moment run on file select
            me.queueFileOperations();

            //create a preview for supported files
            me.bindFilePreview();

            //run the queue operations
            me.disableUpload( _('Processing') );
            me.runQueue();
            return me;
        },
        /**
         * Destroy the file object class, removes the file from queue, stop the upload and removes html
         * @public
         */
        destroy: function(){
            var me = this;

            //stop any file function running
            me.stopQueue();

            //stop upload if the files is being upload
            me.stopUpload();

            //remove file from the queue
            me.AU._removeFile(me.fileId);

            //remove dom element
            me.dom.container.parentNode.removeChild(me.dom.container);

            //set all possible references to null
            me.file       = null;
            me.AU         = null;
            me.xhr        = null;
            me.exifData   = null;
            me.dom        = null;
            me.config     = null;
        },
        /**
         * Adds functions on the file (md5, resize...) to be run in serial to avoid browser hang
         * @returns {FileObject} Return the instance for chaining
         * @private
         */
        queueFileOperations: function() {
            Utils.log('queueFileOperations');
            var me = this;
            //if resize is configured and imageScale plugin is active (present) then queue the resize operation
            if(typeof ImageScale !== 'undefined' && Constants.IMAGE_SCALE_ON) {

                //run and check the before image resize if returns false abort resize
                if (me.AU.triggerEvent('beforeImageResize', [me]) !== false) {

                    //start image scale
                    var scale = new ImageScale(me.file, me.config.resizeImage);

                    //if done change file data
                    scale.done(function (result) {

                        //trigger custom user events
                        me.AU.triggerEvent('imageResize', [me, result]);
                        if(result) {
                            me.file = result;
                            me.setSize(result.size);
                        }
                        me.setMessage('').setProgress(0);
                    }, me).progress(function (percent) {
                        //progress bar update
                        me.workProgress(_('Resizing'), percent);
                    }, me);
                    me._preUploadFun.push(scale);
                }
            }

            //calculate md5
            if(  typeof FileMd5 !== 'undefined' && me.config.md5Calculate && Constants.MD5_ON) {

                //trigger md5 event start
                me.AU.triggerEvent('md5Start', [me]);

                //start md5 calculation
                var md5App = new FileMd5(me.file);
                md5App.done(function(md5) {
                    Utils.log('md5 calculated', md5);
                    me.md5 = md5;
                    me.AU.triggerEvent('md5Done', [me, md5]);
                    me.setMessage('').setProgress(0);
                }, me).progress(function(percent) {
                    //progress bar update
                    me.workProgress( _('Calculating md5'), percent );
                }, me);
                me._preUploadFun.push( md5App );
            }

            //exif read
            if(  typeof ExifReader !== 'undefined' && me.config.exifRead && Constants.EXIF_ON) {
                var exifApp = new ExifReader(me.file);
                exifApp.done(function(exif) {
                    Utils.log('exif calculated', exif);
                    me.exifData = exif;
                    me.AU.triggerEvent('exifDone', [me, exif]);
                    me.setMessage('').setProgress(0);
                    me.imgCls = me.fixOrientation();
                    me.dom.previewImage.className += ' '+me.imgCls;//fix image orientation
                }, me).progress(function(percent) {
                    //progress bar update
                    me.workProgress( _('Reading exif'), percent );
                }, me);
                me._preUploadFun.push( exifApp );
            }

            return me;
        },
        /**
         * Stop the running function on the file, will stops workers.
         */
        stopQueue: function() {
            if(this.currentFun) {
                this.currentFun.stop();
                this.currentFun = null;
            }
            this.enableUpload( _('Ready for upload') );
            this._preUploadFun = [];
        },
        /**
         * Start exec of the functions
         * @returns {FileObject} Chaining
         */
        runQueue: function() {

            if( this._preUploadFun.length > 0 ) {
                //get the next action to do on the file
                var objClass = this._preUploadFun.shift();
                //bind the event to run on finish
                objClass.always(this.runQueue, this);
                //start work
                this.currentFun = objClass;
                objClass.start();
            } else {
                //activate or start upload
                this.enableUpload( _('Ready for upload') );
            }
            return this;
        },
        /**
         * Render file html in the dom based on the selected theme and template
         */
        renderHtml: function() {
            var me = this;

            //base file template configuration: override with fileTemplate option
            var tpl = me.config.fileTemplate ? me.config.fileTemplate : [
            '<a class="ax-prev-container">',
                '<img style="cursor: pointer;" class="ax-preview" src="" alt="">',
            '</a>',
            '<div class="ax-details">',
                '<div class="ax-file-name"></div>',
                '<div class="ax-file-size"></div>',
            '</div>',
            '<div class="ax-progress-data">',
                '<div class="ax-progress">',
                    '<div class="loader ax-progress-bar"></div>',
                    '<div class="ax-progress-info"></div>',
                '</div>',
                '<div class="ax-progress-stat"></div>',
            '</div>',
            '<div class="ax-toolbar">',
                '<a class="ax-upload ax-button">',
                    '<span class="ax-upload-icon ax-icon"></span>',
                    '<span class="ax-btn-text"></span>',
                '</a>',
                '<a class="ax-remove ax-button">',
                    '<span class="ax-clear-icon ax-icon"></span>',
                    '<span class="ax-btn-text"></span>',
                '</a>',
                '<a class="ax-delete ax-button ax-disabled">',
                    '<span class="ax-delete-icon ax-icon"></span>',
                    '<span class="ax-btn-text"></span>',
                '</a>',
                '<a class="ax-info ax-button">',
                    '<span class="ax-info-icon ax-icon"></span>',
                    '<span class="ax-btn-text"></span>',
                '</a>',
            '</div>'].join('');

            var tplEdit = me.AU.triggerEvent('beforeRenderFile', [me, tpl]);
            if (tplEdit) {
                tpl = tplEdit;
            }

            //create the file placeholder

            me.dom.container = document.createElement('div');
            //just a short hand avoiding long code down
            var c = me.dom.container;
            c.innerHTML = tpl;
            c.classList.add('ax-file-wrapper');


            //get a reference to the visible elements
            me.dom.nameContainer      = Utils.getEl(c, '.ax-file-name');
            me.dom.sizeContainer      = Utils.getEl(c, '.ax-file-size');

            //upload button
            me.dom.uploadButton       = Utils.getEl(c, '.ax-upload');
            me.dom.uploadButtonText   = Utils.getEl(me.dom.uploadButton, '.ax-btn-text');

            //remove button
            me.dom.removeButton       = Utils.getEl(c, '.ax-remove');
            me.dom.removeButtonText   = Utils.getEl(me.dom.removeButton, '.ax-btn-text');

            //delete button
            me.dom.deleteButton       = Utils.getEl(c, '.ax-delete');
            me.dom.deleteButtonText   = Utils.getEl(me.dom.deleteButton, '.ax-btn-text');

            //info button
            me.dom.infoButton         = Utils.getEl(c, '.ax-info');
            me.dom.infoButtonText     = Utils.getEl(me.dom.infoButton, '.ax-btn-text');

            me.dom.previewImage       = Utils.getEl(c, '.ax-preview');
            me.dom.previewContainer   = Utils.getEl(c, '.ax-prev-container');
            me.dom.progressBar        = Utils.getEl(c, '.ax-progress-bar');
            me.dom.progressInfo       = Utils.getEl(c, '.ax-progress-info');
            me.dom.progressStat       = Utils.getEl(c, '.ax-progress-stat');

            //use extra function to populate DOM elements with data
            //this ensure to check if the element exists, user can remove it by changing the template
            me.setName(me.name)
                .setSize(me.size)
                .setUploadButton()
                .setDeleteButton(false)
                .setRemoveButton(_('Remove file from queue'))
                .setInfoButton();

            me.AU.dom.fileList.appendChild( me.dom.container );
            me.AU.triggerEvent('afterRenderFile', [me, me.dom]);
            return me;
        },
        /**
         * Set the name of the file. It will set the DOM html and the name of the uploaded file on server
         * @param {String} name
         * @returns {FileObject}
         */
        setName: function(name) {
            this.name	= name;
            //update dom
            this.dom.container.setAttribute('title', name);
            if(this.dom.nameContainer) {
                this.dom.nameContainer.innerHTML = name;
                this.dom.nameContainer.setAttribute('title', name);
            }

            return this;
        },
        /**
         * Set the file size. Only for internal use, since file size cannot be set by the user
         * @param size
         * @returns {FileObject}
         * @private
         */
        setSize: function(size) {
            this.size = size;
            //update dom
            if(this.dom.sizeContainer) {
                this.dom.sizeContainer.innerHTML = Utils.formatSize(size);
                this.dom.sizeContainer.setAttribute('title', this.dom.sizeContainer.innerHTML);
            }
            return this;
        },
        /**
         * Setup the upload button of the file, manages status and String
         * @returns {FileObject}
         */
        setUploadButton: function() {
            if(this.dom.uploadButton && !this.config.hideUploadButton) {
                if( this.status == Constants.AX_READY || this.status == Constants.AX_ERROR) {
                    this.dom.uploadButton.classList.remove('ax-abort');
                    this.dom.uploadButton.setAttribute('title', _('Start upload'));

                    if( this.dom.uploadButtonText ) {
                        this.dom.uploadButtonText.innerHTML = _('Upload');
                    }
                } else {
                    this.dom.uploadButton.classList.add('ax-abort');
                    this.dom.uploadButton.setAttribute('title', _('Abort upload'));
                    if( this.dom.uploadButtonText ) {
                        this.dom.uploadButtonText.innerHTML = _('Abort');
                    }
                }
            }
            return this;
        },
        /**
         * Set remove button
         * @param msg
         * @returns {FileObject}
         */
        setRemoveButton: function(msg) {
            if(this.dom.removeButton) {
                this.dom.removeButton.setAttribute('title', msg);
                if( this.dom.removeButtonText ) {
                    this.dom.removeButtonText.innerHTML = _('Remove');
                }
            }
            return this;
        },
        /**
         * Set the delete button status and string
         * @param enable
         * @returns {FileObject}
         */
        setDeleteButton: function (enable) {
            if( this.dom.deleteButton ) {
                if( enable ) {
                    this.dom.deleteButton.setAttribute('title', _('Delete file from server'));
                    this.dom.deleteButton.classList.remove('ax-disabled');
                    if( this.dom.deleteButtonText ) {
                        this.dom.deleteButtonText.innerHTML = _('Delete');
                    }
                } else {
                    this.dom.deleteButton.setAttribute('title', _('File still to be uploaded'));
                    this.dom.deleteButton.classList.add('ax-disabled');
                    if( this.dom.deleteButtonText ) {
                        this.dom.deleteButtonText.innerHTML = _('Delete');
                    }
                }
            }
            return this;
        },
        /**
         * Set the exif info button
         * @returns {FileObject}
         */
        setInfoButton: function() {
            if( this.dom.infoButton ) {
                this.dom.infoButton.setAttribute('title', _('Show file exif info'));
                if( this.dom.infoButtonText ) {
                    this.dom.infoButtonText.innerHTML = _('Info');
                }
            }
            return this;
        },
        /**
         * Creates the image preview
         * @param show if true enalbes the preview
         * @param src the image sr
         * @returns {FileObject}
         * @private
         */
        setPreviewImage: function(show, src) {
            var me = this;
            if( me.dom.previewImage ) {
                if (show) {
                    me.dom.previewContainer && (me.dom.previewContainer.style.background = 'none');//lazy if
                    me.dom.previewImage.src = src;
                    me.dom.previewImage.style.cursor = 'pointer';
                    me.dom.previewImage.setAttribute('alt', _('Preview'));
                    me.dom.previewImage.addEventListener('click', function () {
                        Utils.lightBoxPreview(this, me.name, Utils.formatSize(me.size), me.imgCls);
                    });
                } else {
                    if(me.dom.previewContainer) {
                        me.dom.previewContainer.classList.add('ax-no-preview');
                        me.dom.previewContainer.innerHTML = '<span class="ax-extension">'+me.ext+'</span>';
                    }
                    me.dom.previewImage.style.display = 'none';
                }
            }
            return me;
        },
        /**
         * Disables the upload for this file
         * @param msg Message to show on the progress bar
         * @returns {FileObject}
         */
        disableUpload: function(msg) {
            var me = this;
            me.disabled = true;
            me.dom.container.classList.add('ax-disabled');
            me.setMessage(msg);
            return me;
        },
        /**
         * Enables the upload
         * @param msg Message to show on the progress bar
         * @returns {FileObject}
         */
        enableUpload: function(msg) {
            var me = this;
            me.disabled = false;
            me.dom.container.classList.remove('ax-disabled');
            me.setMessage(msg);
            me.setProgress(0);
            return me;
        },
        /**
         * Updates the progress bar width
         * @param {Number} percent from 1 to 100
         * @returns {FileObject} Chaining
         */
        setProgress: function(percent) {
            if( this.dom.progressBar ) {
                this.dom.progressBar.style.width = percent + '%';
            }
            return this;
        },
        /**
         * Updates the progress bar and set the message information at the same time
         * @param {String} msg Message to show
         * @param {Number} p percent from 1 to 100
         * @returns {FileObject} Chaining
         */
        workProgress: function(msg, p) {
            var me = this;
            me.setProgress(p);
            me.setMessage(msg + ' ' + p + '%');
            me.AU.triggerEvent('progressFile', [this, p]);
            return me;
        },
        /**
         * Set the visible message on the bar
         * Check first if the message placeholder exists
         * @param msg string/html to view
         * @returns {FileObject} Chaining
         */
        setMessage: function(msg) {
            var me = this;
            if( me.dom.progressInfo ) {
                me.dom.progressInfo.innerHTML = msg;
                me.dom.progressInfo.setAttribute('title', msg);
            }
            return me;
        },
        /**
         * Set the information to attach to the file
         * @param {String|Object} info normally would be exif information
         * @returns {FileObject} Chaining
         * @private
         */
        setInfo: function(info) {
            this.info = info;
            return this;
        },
        /**
         * Set the extra information returned from the server calls
         * @param {String|Object}
         * @returns {FileObject} Chaining
         * @private
         */
        setExtraInfo: function(info) {
            this.extraInfo = info;
            return this;
        },
        /**
         * Get the info of the file
         * @returns {null|*}
         */
        getInfo: function(){
            return this.info;
        },

        setTempName: function(tempName) {
            this.tempFileName = tempName;
            return this;
        },
        /**
         * Set the status of the file and update the dom elements
         * @param {Number} status
         * @returns {FileObject}
         */
        setStatus: function(status) {
            var me      = this;
            me.status	= parseInt(status);
            me.setUploadButton();
            switch( me.status ) {
                case Constants.AX_UPLOADING:
                    me.workProgress('', 0);
                    break;
                case Constants.AX_READY:
                    me.workProgress( _('Ready for upload'), 0);
                    me.setDeleteButton(false);
                    break;
                case Constants.AX_ERROR:
                    break;
                case Constants.AX_DONE:
                    me.setMessage(_('File Uploaded'));
                    me.setDeleteButton(true);
            }
            return me;
        },
        /**
         * Bind action events, upload, remove, preview
         * @private
         */
        bindEvents: function() {
            var me = this;

            //bind start upload
            if(me.dom.uploadButton) {
                me.dom.uploadButton.addEventListener('click', function () {
                    if (me.config.enable && !me.disabled) {
                        //start upload
                        me.status != Constants.AX_UPLOADING ? me.AU.enqueueFile(me.fileId) : me.stopUpload();
                        //me.status != Constants.AX_UPLOADING ?  me.startUpload() : me.stopUpload();
                    }
                });
            }

            //bind remove file
            if(me.dom.removeButton) {
                me.dom.removeButton.addEventListener('click', function () {
                    //on first click it will stop the pre upload functions queue, if any
                    if (me.config.enable && !me.disabled){
                        me.destroy();
                    } else {
                        me.stopQueue();
                    }
                });
            }

            //Is this really useful?
            //@deprecated
            if( me.config.editFilename ) {
                //on double click bind the edit file name
                me.dom.nameContainer.addEventListener('dblclick', function(e){
                    if(me.config.enable && !me.disabled) {
                        e.stopPropagation();
                        //get file name without extension
                        var file_name_no_ext = me.name.replace('.' + me.ext, '');
                        this.innerHTML = '<input type="text" value="'+file_name_no_ext+'" />.' + me.ext;
                    }

                });
                me.dom.nameContainer.addEventListener('blur focusout', function(e){
                    e.stopPropagation();
                    var newName = this.firstChild;
                    if( newName ) {
                        var cleanString = newName.value.replace(/[|&;$%@"<>()+,]/g, '');//remove bad filename chars
                        var fullName    = cleanString + '.' + me.ext;//add extension
                        me.setName(fullName);
                    }
                });
            }
            //end @deprecated

            //delete button
            if( me.dom.deleteButton && me.config.allowDelete ) {
                me.dom.deleteButton.addEventListener('click', function() {
                    if (!me.disabled && me.status === Constants.AX_DONE ) {
                        me.askUser(_('Delete uploaded file?')).yes(function () {
                            me.deleteFile();
                        }).no(function () {
                            me._onError('abort', _('User stop'));
                        });
                    }
                });
            }

            //info button
            if( this.dom.infoButton ) {
                this.dom.infoButton.addEventListener('click', function() {
                    var strPretty = '';
                    for (var a in me.exifData) {
                        if (me.exifData.hasOwnProperty(a)) {
                            if (typeof me.exifData[a] === 'object') {
                                strPretty += a + ' : [' +  me.exifData[a].length + ' values]' + "\n";
                            } else {
                                strPretty += a + ' : ' + me.exifData[a] + "\n";
                            }
                        }
                    }
                    alert(strPretty);
                });
            }

            return this;
        },
        /**
         * Function that makes a Ajax request to upload.php server url to delete the file
         * @private
         */
        deleteFile: function() {
            var me = this;
            if( me.config.allowDelete ) {
                var params = me.getParams();
                params.append('ax-delete-file', 1);
                Utils.ajaxPost(me.config.url, params, null);
                //we could use the post callback but delete should be fast
                //if file is deleted then reset its status
                me.setStatus(Constants.AX_READY);
            }
        },
        /**
         * Bind file preview on image
         * @private
         */
        bindFilePreview: function() {
            var me          = this;
            var doPreview   = me.AU.triggerEvent('beforePreview', [this]);
            var createPrev  = me.config.previews && me.file.type.match(/image.*/) &&
                                ( me.ext === 'jpeg' || me.ext === 'jpg' || me.ext === 'gif' || me.ext === 'png' ) ;
            var URL         = window.URL || window.webkitURL;
            if( URL && URL.createObjectURL && createPrev && me.config.previewFileSize >= me.size && doPreview !== false ) {
                var img = new Image();
                img.onload = function() {
                    me.setPreviewImage(true, this.src);
                    me.AU.triggerEvent('preview', [this]);
                    me.setStatus(Constants.AX_READY);
                    URL.revokeObjectURL( me.file );
                    img = null;
                };
                img.onerror = function() {
                    me.setStatus(Constants.AX_READY);
                };
                img.src = URL.createObjectURL(this.file);
            } else {
                me.setPreviewImage(false, null);
                me.setStatus(Constants.AX_READY);
            }
            return this;
        },
        /**
         * Fix view the orientation by reading the exif
         */
        fixOrientation: function() {
            var me = this;
            if(me.dom.previewImage && this.exifData && this.exifData.Orientation) {
                var width 			= me.dom.previewImage.width;
                var height 			= me.dom.previewImage.height;
                var orientation 	= this.exifData.Orientation;
                Utils.log('fixOrientation:', orientation);
                switch (orientation)
                {
                    case 5:
                    case 6:
                    case 7:
                    case 8://swap dims
                        break;
                    default:
                }

                /**
                 1 = The 0th row is at the visual top of the image, and the 0th column is the visual left-hand side.
                 2 = The 0th row is at the visual top of the image, and the 0th column is the visual right-hand side.
                 3 = The 0th row is at the visual bottom of the image, and the 0th column is the visual right-hand side.
                 4 = The 0th row is at the visual bottom of the image, and the 0th column is the visual left-hand side.
                 5 = The 0th row is the visual left-hand side of the image, and the 0th column is the visual top.
                 6 = The 0th row is the visual right-hand side of the image, and the 0th column is the visual top.
                 7 = The 0th row is the visual right-hand side of the image, and the 0th column is the visual bottom.
                 8 = The 0th row is the visual left-hand side of the image, and the 0th column is the visual bottom.
                 */
                switch (orientation) {
                    case 2:
                        // horizontal flip
                        return 'ax-flip-x';
                    case 3:
                        // 180 rotate left
                        return 'ax-rotate-180';
                    case 4:
                        // vertical flip
                        return 'ax-flip-y';
                    case 5:
                        // vertical flip + 90 rotate right
                        return 'ax-flip-y-90';
                    case 6:
                        // 90 rotate right
                        return 'ax-rotate-90';
                    case 7:
                        // horizontal flip + 90 rotate right
                        return 'ax-flip-x-90';
                    case 8:
                        // 90 rotate left
                        return 'ax-rotate-inv-90';
                }
            } else {
                Utils.log('fixOrientation: no exif');
            }
        },


        /**
         * This is a simple interaction dialog of the uploaded file, can be used for different prompts
         * For example can ask user to confirm file delete or confirm file override
         * Needs a deferred as parameter
         * @param msg
         * @returns {SimpleRunner}
         */
        askUser: function(msg) {
            var me      = this;
            var runner  = new SimpleRunner(me);

            var html = ['<div class="ax-ask-inner">',
                            '<div class="ax-ask-quest">'+msg+'</div> ',
                            '<a title="'+_('Yes')+'" class="ax-button ax-reply-yes"><span class="ax-icon"></span> <span class="ax-btn-text">'+_('Yes')+'</span></a>',
                            '<a title="'+_('No')+'" class="ax-button ax-reply-no"><span class="ax-icon"></span> <span class="ax-btn-text">'+_('No')+'</span></a>',
                        '</div>'];

            //create the ask div container
            var askDiv = document.createElement('div');
            askDiv.className = 'ax-ask-div';
            askDiv.innerHTML = html.join('');
            this.dom.container.appendChild(askDiv);

            var yesButton   = Utils.getEl(askDiv, '.ax-reply-yes');
            var noButton    = Utils.getEl(askDiv, '.ax-reply-no');

            if( yesButton ) {
                yesButton.addEventListener('click', function (e) {
                    runner.run('yes');
                });
            }

            if( noButton ) {
                noButton.addEventListener('click', function (e) {
                    runner.run('no');
                });
            }

            runner.always(function(){
                askDiv.parentNode.removeChild(askDiv);
                askDiv = null;//remove ref
            });

            return runner;
        },

        /**
         * Check if the file exists on server.
         * @returns {SimpleRunner} a simple deferred system
         */
        checkFileExists: function()  {
            var runner  = new SimpleRunner(this);
            var me      = this;
            if( this.config.checkFileExists ) {
                var params = this.getParams();
                params.append('ax-check-file', 1);
                Utils.ajaxPost(this.config.url, params, function(msg) {
                    runner.run( msg.info == 'yes' ? 'yes' : 'no');
                });
            } else {
                setTimeout(function(){
                    runner.run('no');
                }, 10);
            }
            return runner;
        },


        /**
         * Checks if file exists, prompts the user, and start upload
         * Called by the queue manager for respecting the quotes slots
         * @returns {*}
         */
        startUpload: function() {
            Utils.log('startUpload:::called');
            var me = this;
            //if upload is disabled then stop
            if(me.disabled) return false;

            //check if the before upload returns false, from user validation event
            if( me.AU.triggerEvent('beforeUploadFile', [me, this.name]) !== false ) {
                me.status = Constants.AX_CHECK;//check status

                //check if file exists on server, this returns a deferred
                me.checkFileExists().yes(function(){

                    me.askUser( _('File exits on server. Override?')).yes(function(){
                        me._upload();
                    }).no(function(){
                        me._onError( 'abort', _('User stop') );
                    });

                }).no(function(){
                    me._upload();
                });
            } else {
                me._onError('beforeUploadFile', _('beforeUploadFile::File validation failed') );
            }
            return me;
        },
        /**
         * Get the params for the single to send to the URL
         * @returns {FormData}
         */
        getParams: function() {
            //get standard params
            var params = this.AU.getBaseParams(this);
            params.append('ax-file-size', this.size);
            params.append('ax-file-name', this.name);
            params.append('ax-temp-name', this.tempFileName);
            return params;
        },
        /**
         * Stop upload function. it reset visual information and if the upload is xhr it calls the abort
         */
        stopUpload: function() {
            if( this.xhr!==null ) {
                this.xhr.abort();
                this.xhr = null;
            }

            if( this.speedInterval ) {
                clearInterval(this.speedInterval);
            }
            return this;
        },
        /**
         * Main upload ajax html5 method, uses XMLHttpRequest object for uploading file
         * Runs in recursive mode for uploading files by chunk
         * @private
         */
        _upload: function() {
            Utils.log('_upload:::Uploading chunk');
            var me          = this;
            var config 	    = me.config;
            var file		= me.file;
            var currentByte	= me.currentByte;
            var name		= me.name;
            var size		= me.size;
            var chunkSize	= config.chunkSize;	//chunk size
            var endByte		= chunkSize + currentByte;
            var isLast		= (size - endByte <= 0);
            var chunk		= file;
            me.xhr 		    = new XMLHttpRequest();//prepare xhr for upload

            if( currentByte === 0) {
                this._onStart();
            }
            //anti freeze check
            me.requestStartTime		= new Date();
            me.abortTimeout		    = null;

            if(chunkSize == 0) {
                chunk	= file;
                isLast	= true;
            } else {
                chunk = Utils.sliceFile(file, currentByte, endByte);
            }

            if(chunk === null) {
                //no slice, it is not supported if null
                chunk	= file;
                isLast	= true;
            }

            //abort event, (nothing to do for the moment)
            me.xhr.upload.addEventListener('abort', function(e){
                me._onError('aborted', _('Upload aborted'));
            }, false);

            //progress function, with ajax upload progress can be monitored
            me.xhr.upload.addEventListener('progress', function(e) {
                if ( e.lengthComputable ) {
                    var progress = Math.round((e.loaded + currentByte) * 100 / size);
                    me.workProgress( _('Uploading'), progress);
                    me.loading_bytes = e.loaded + currentByte;
                    me.AU.progress(me, currentByte);
                }
            }, false);

            me.xhr.upload.addEventListener('error', function(e) {
                me._onError(this.responseText);
            }, false);

            me.xhr.onreadystatechange = function() {
                if(this.readyState == 4 && this.status == 200) {
                    me.AU.triggerEvent('chunkUpload', [file, name, chunk, me.xhr]);
                    try {
                        var ret	= JSON.parse( this.responseText );
                        // get the temp name from the server
                        // the first uploaded chunk returns also the temporary name on the server
                        // this name will be used to upload the next chunks
                        if(currentByte == 0) {
                            me.setTempName( ret.temp_name );
                        }

                        //calculate last request duration, to be used as timeout for next requests
                        me.requestDuration = (new Date() - me.requestStartTime);
                        Utils.log('Request Duration (ms): ', me.requestDuration);

                        // clear the timeout that aborts the request if it is freeze
                        if( me.abortTimeout !== null ){
                            clearTimeout( me.abortTimeout );
                            me.abortTimeout = null;
                        }

                        if( parseInt(ret.status) === Constants.AX_ERROR ) {
                            throw ret.info;
                        } else if(isLast) {
                            //exec finish event of the file
                            me._onFinishUpload(ret);
                        } else {
                            //upload the next chunk
                            me.currentByte = endByte;
                            me._upload();
                        }
                    } catch(err) {
                        me._onError( 'server_error', err.toString() );
                    }
                } else if(this.status == 404) {
                    me._onError( 'server_error', '_upload::URL not found 404. Be sure to point to the correct upload.php.' );
                }
            };

            //anti freeze system: if the current request last more then the prev request per 10 times then abort it and restart
            if( me.requestDuration > 0 && !isLast) {
                //start a timeout base on the time of the prev request duration time x10
                me.abortTimeout = setTimeout(function(){
                    me.xhr.abort();//abort the request
                    me._upload();//retry upload of current chunk and resend

                }, (me.requestDuration * 10) );
            }

            //some parameters are mandatory for correct file upload
            var params = this.getParams();
            params.append('ax_file_input', chunk);
            params.append('ax-start-byte', me.currentByte);
            params.append('ax-file-md5', me.md5);

            //set some optional custom headers
            me.xhr.open('POST', config.url, config.async);
            me.xhr.send(params);
        },
        /**
         * Internal callback running on upload start
         * @callback
         * @private
         */
        _onStart: function() {
            var me = this;
            //progress notify
            me.workProgress( _('Upload started'), 0);
            me.loading_bytes = 0;
            me.AU.progress(this, 0);

            //trigger the start event
            me.AU.triggerEvent('startFile', [this]);

            //upload code as callback of check file exits
            me.setStatus( Constants.AX_UPLOADING );

            //start bandwidth information
            if( me.config.bandwidthUpdateInterval && me.dom.progressStat) {
                me.speedInterval = setInterval(function(){

                    var diff = (me.loading_bytes - me.temp_bytes)* (1000/me.config.bandwidthUpdateInterval);
                    me.dom.progressStat.innerHTML = Utils.formatSize(diff) +'/s';
                    me.temp_bytes = me.loading_bytes;

                },  me.config.bandwidthUpdateInterval);
            }
        },
        /**
         * Trigger when an error is detect during file upload or during file validation
         * @param err error code as string
         * @param msg Human error messages
         * @private
         */
        _onError : function(err, msg) {
            var me = this;
            //Upload failed
            me.setMessage( msg )
                .setInfo(err);

            if(err == 'aborted') {
                me.setStatus( Constants.AX_READY ); //set status to idle
            } else if(err == 'error') {
                me.setStatus( Constants.AX_ERROR );

                //if remove on error option is enabled the remove the file
                if( me.config.removeOnError ) {
                    me.destroy();
                }
            }
            me._onComplete();
        },

        /**
         * Function that runs on upload end
         * @param name return file name from the server
         * @param size return file size, for old browsers only
         * @param status the status of upload
         * @param info any other user information
         * @private
         */
        _onFinishUpload : function(json) {
            var me = this;
            //update file information
            me.setName(json.name)
                .setStatus(json.status)
                .setInfo(json.info)
                .setExtraInfo(json.more)
                .setMessage( _('File uploaded') );//update view information

            me.checkSum = json.checkSum;

            me._onComplete();

            //remove on success option
            if( me.config.removeOnSuccess ) {
                me.destroy();
            }
        },

        /**
         * Run always on file upload/error status complete
         * Used for resetting variables and internal status
         * @private
         */
        _onComplete: function() {
            var me = this;
            //to be done always
            me.currentByte = 0; 	//reset current byte
            me.setProgress(0);        //reset progress bar

            //remove interval speed updater
            if( this.speedInterval ) {
                Utils.log('stopping speedInterval');
                clearInterval(me.speedInterval);
                me.speedInterval = null;
            }

            //Inform the queue manager for file finish
            me.AU.fileCompleted( me.fileId );
            return this;
        }
    };

    return FileObject;
});
/**
 * @file The main queue manager of the files
 * @author Alban Xhaferllari
 * @date
 * @version 4.0
 */
define('RealUploader',['FileObject', 'Constants', 'Utils', 'i18n'], /** @lends RealUploader */ function (FileObject, Constants, Utils, _) {
    'use strict';
    /**
     * Main uploader class. Manages the queue of upload and the template
     * @class RealUploader
     * @param querySelector {String|HTMLElement} The element where to start the uploader, can be either a DOM element or a
     * querySelector CSS
     * @example <caption>As query selector</caption>
     * new RealUploader('#some_id');//create a ajax uploader to the element with ID some_id
     * @example <caption>HTMLElement</caption>
     * var div = document.createElement('div');
     * document.body.appendChild(div);
     * new RealUploader(div);
     * @param config {Object} Configuration of the RealUploader set by the user
     * @param {String} [config.accept=null] Accept attribute to set on the the file input, will be used in combination
     * with the allowExtension setting
     * @example <caption>Accept example</caption>
     * {
     *      accept: 'image/*'; //will accept every image
     * }
     * @param {Array} [config.allowedExtensions=[]] Array of allowed upload extension, can be set also in php script
     * @example <caption>allowedExtensions</caption>
     * {
     *      allowedExtensions: ['jpg', 'pdf']; //only files with this extensions will be selected and the input
     *      //will be filtered
     * }
     * @param {boolean} [config.allowDelete=false] Allow user to delete file after upload. NOTE: should also be enabled
     * from server side for security reason
     * @param {boolean} [config.autoStart=false] If true upload will start immediately after drop of files or select
     * of files
     * @param {boolean} [config.async=true] Set the XMlHttpRequest async for the upload
     * @param {number} [config.bandwidthUpdateInterval=500] Set the interval that refresh the bandwidth calculation,
     * 0 to disable
     * @param {boolean} [config.checkFileExists=false] Do not ask user for file exits if false, if true ask user to
     * override or not the file
     * @param {number} [config.chunkSize = 1048576] Default 1Mb, if supported send file to server by chunks, not at once
     * @param {Object} [config.data={}] User data to send to the server with the file upload
     * @param {String|Object|Function}[config.dropClass='ax-drop'] Set the class of dom element when the files
     * are drag over
     * @param {String|HTMLElement} [config.dropArea='self'] Set the DOM element where to bind the drag event. If it
     * is provided the self string then the dropArea will be bind to the uploader container
     * @param {boolean} [config.enable=true] Start the uploader state. If set to false, it will not be possible to
     * upload files until an external call to the enable method will be called
     * @param {boolean} [config.editFilename=false] Enabled file name edit before upload with double click
     * @param {boolean} [config.exifRead=false] Enables exif read from JPEG file, it will attach the information to
     * the file object
     * @param {HTML} [config.fileTemplate=null] Customize the html for the file template, to be used by keeping the
     * class names. This will allow the users to change easy the html and preview.
     * The default value is hardcoded inside the code for more see the file documentation
     * @param {boolean} [config.hideUploadButton=false] Hides the main upload button, to be used on autoStart to true
     * or when the upload is trigger by external function
     * @param {String} [config.language='auto'] Set the language of the string for button, labels... By default
     * it is detected the browser language. The format should be en_UK, it_IT, sq_AL ...
     * @param {HTML} [config.mainTemplate=null] Set the main template html for the base buttons: Add Files, Upload All,
     * Remove All. This will allow the users to change easy the html. The default value is hardcoded for more see
     * the documentation
     * @param {number} [config.maxFiles=9999] Set the maximum file of number allow to upload at the same session.
     * Recommended to keep this settings low when uploading big files
     * @param {number} [config.maxConnections=3] Set the maximum number of parallel uploads. By default most of browser
     * will allow 6 parallel connections. Limit to three will allow a faster file upload.
     * @param {number|String} [config.maxFileSize=10485760] Set the maximum file size for file upload.
     * Can be set as String with format 10M, 200K, 4G to set the unit or as number 1123123 for indicating bytes.
     * @param {number|String} [config.minFileSize=0] Set the minimum file size for file upload. Can be set as String
     * with format 10M, 200K, 4G to set the unit or as number 1123123 for indicating bytes.
     * @param {boolean} [config.md5Calculate=false] Calculate the MD5 hash of the file using WebWorkers,
     * can slow down or hang the browser on big files, use with care.
     * @param {boolean} [config.md5Check=false] Verify the correct file upload by comparing the server md5 with the md5
     * calculated on client side. Works only of md5Calculate is enabled.
     * @param {boolean} [config.overrideFile=false] If set to false the files on the server will not be override.
     * The file will be renamed if already exits. If set to true the file user will be prompt to override the file.
     * @param {number} [config.thumbHeight=0] Set the maximum height of the image thumbnail to generate on server
     * @param {number} [config.thumbWidth=0] Set the maximum height of the image to thumbnail on server
     * @param {String} [config.thumbPostfix='_thumb'] Set the postfix of the generated re-sized image, Filename_thumb.ext
     * @param {String} [config.thumbPath=''] Set the path where to upload the re-sized image
     * @param {String} [config.thumbFormat=''] Set the thumbnail export format, by default same as original image.
     * Possible values jpg, png, gif.
     * @param {URL} [config.url='upload.php'] Set the server side script that handles the upload
     * @param {boolean} [config.uploadDir=false] Experimental feature for uploading an entire folder.
     * Works only on Google Chrome
     * @param {boolean} [config.removeOnSuccess=false] If true the file will be removed from the list when the upload is successful
     * @param {boolean} [config.removeOnError=false] If true the file will be removed from the list when the upload fails
     * @param {String|function} [config.remotePath=''] Set the remote path where to upload the file on server. If this path
     * is set on the server script then this value will be ignored. The folder will be created automatically if does not exists
     * @param {Object} [config.resizeImage] Resize the image settings before uploading on server. This will create a new file
     * and can work both with the server size. Uses WebWorkers and Canvas.
     * @param {number} [config.resizeImage.maxWidth=0] Maximum  width for the resize
     * @param {number} [config.resizeImage.maxHeight=0] Maximum  height for the resize
     * @param {number} [config.resizeImage.outputQuality=1] Set the output quality. Possible values from 0 to 1
     * @param {number} [config.resizeImage.scaleMethod=3] Select the scale method to use for the image resize. Current
     * available values 0 for nearest neighbour, 1 for haming 2 for lancoz 2, 3 for lancoz 3
     * @param {number} [config.resizeImage.keepExif=false] Set if either to keep exif during resize, works only if
     * exif reader is enabled
     * @param {number} [config.resizeImage.unsharpAmount=0] 0-500 set the sharpness level
     * @param {number} [config.resizeImage.unsharpThreshold=0] 0-100 set the sharpness threshold
     * @param {number} [config.resizeImage.alpha=true]
     * @param {String} [config.resizeImage.outputFormat='auto'] Select the output format can be png/jpg
     * @param {boolean} [config.resizeImage.removeExif=false] Remove the exif info on re-sized if true. false will copy
     * @param {boolean} [config.resizeImage.allowOverResize=false] If the maxWidth/maxHeight is over the real image
     * @param {boolean} [config.resizeImage.keepExif=false] If true will copy the exif during resize
     * size then the image will not be reside if set to true then this will allow to stretch the image on resize
     * the exif info on the new image
     * @param {boolean} [config.previews=true] If true the system will make the preview of the image and a light box
     * Set to false to avoid memory problems on multiple image selection
     * @param {number} [config.previewFileSize=10485760] Set a limit to the image preview, for big images the browser
     * can cause memory problems and slowness
     * @param {Function} [config.listeners] Main listeners handles. This is an object containing all listeners events
     * @param {Function} [config.listeners.start] Runs on upload start of the upload
     * @param {Function} [config.listeners.startFile] Runs on upload start for the single file
     * @param {Function} [config.listeners.finish] Runs when all files finish uploading
     * @param {Function} [config.listeners.finishFile] Runs on upload finish success for the single file
     * @param {Function} [config.listeners.error] Runs on error for any file
     * @param {Function} [config.listeners.errorFile] Runs on error upload for single file
     * @param {Function} [config.listeners.beforeUpload] Runs before upload all, if return false then upload is stopped
     * @param {Function} [config.listeners.beforeUploadFile] Runs before the upload of the single if returns false upload is stopped for the single file
     * @param {Function} [config.listeners.init] Runs on plugin initialization
     * @param {Function} [config.listeners.progress] Runs on progress action of upload all
     * @param {Function} [config.listeners.progressFile] Runs on file elaboration progress, upload/md5 calc/resize
     * @param {Function} [config.listeners.beforePreview] Runs before preview, if return false stops preview
     * @param {Function} [config.listeners.preview] Runs after preview has been done
     * @param {Function} [config.listeners.select] Runs after file select, returns selected file as parameter of callback
     * @param {Function} [config.listeners.chunkUpload] Runs on a chunk upload
     * @param {Function} [config.listeners.exifDone] Runs once the exifDone has been calculated
     * @param {Function} [config.listeners.md5Done] Runs once the md5 has been calculated
     * @param {Function} [config.listeners.beforeImageResize] Runs before the resize takes place
     * @param {Function} [config.listeners.imageResize] Runs on image resize done
     * @param {Function} [config.validateFile=null] User defined callback to run on file validation, with custom
     * condition. If this function return false then the file will not be added to the list
     * @constructor
     */
    var RealUploader = function (querySelector, config) {

        this.fileList = {};                   // this is the real file list, file are indexed by a random internal id
        this.fileIndex = 0;                    // keep a index for each added file, this could be also a random ID, @generateFileId
        this.uploadQueue = [];                   // files in queue ready to be processed/upload
        this.globalStatus = Constants.AX_IDLE;    // the status of the uploader
        this.dom = {};                   // dom container, contains reference to all main dom element
        this.total_bytes = 0;                    // run time variable, track the total upload bytes
        this.checkInterval = false;                // check interval


        //check the DOM element where to apply the uploader
        if (querySelector instanceof HTMLElement) {
            this.dom.container = querySelector;// main container
        } else if (typeof querySelector === 'string') {
            this.dom.container = Utils.getEl(querySelector);
        }

        //if no DOM element container found then raise an error and stop
        if (!this.dom.container) {
            console.error(querySelector + _(' not found on the DOM'));
            return;
        }

        //check if the plugin has already been applied to this element
        if (this.dom.container.classList.contains('ax-uploader')) {
            console.warn(_('Real Uploader already bind to this element'));
            return;
        }

        //OPTIONS A-Z
        this.config = {
            _data: {
                accept: null,
                allowedExtensions: [],
                allowDelete: false,
                autoStart: false,
                async: true,
                bandwidthUpdateInterval: 500,
                checkFileExists: false,
                chunkSize: 1048576,
                data: {},
                dropClass: 'ax-drop',
                dropArea: 'self',
                enable: true,
                editFilename: false,
                exifRead: false,
                fileTemplate: null,
                hideUploadButton: false,
                language: 'auto',
                mainTemplate: null,
                maxFiles: 9999,
                maxConnections: 3,
                maxFileSize: 10485760,
                minFileSize: 0,
                md5Calculate: false,
                md5Check: true,
                overrideFile: false,

                /**
                 * This settings are used create a re-sized copy (copy) of images on server side
                 * Currently this is supported only if any processing image extension is enabled on sever
                 * For PHP it uses the GD library
                 */
                thumbHeight: 0,
                thumbWidth: 0,
                thumbPostfix: '_thumb',
                thumbPath: '',
                thumbFormat: '',
                url: 'upload.php',
                uploadDir: false,
                removeOnSuccess: false,
                removeOnError: false,
                remotePath: '',

                /**
                 * Client side resize
                 */
                resizeImage: {
                    maxWidth: 0,
                    maxHeight: 0,
                    outputQuality: 1,
                    scaleMethod: 3,
                    outputFormat: null,
                    allowOverResize: false,
                    keepExif: false,
                    keepAspectRatio: true,
                    unsharpAmount: 0,
                    unsharpThreshold: 0,
                    alpha: true
                },
                previews: true,
                previewFileSize: 10 * 1024 * 1024,
                listeners: null,
                validateFile: null
            }
        };

        //The total list of events. Each array will contain eventually user bind callbacks for the events
        this.events = {
            init: [], //runs on plugin initialization
            start: [], //runs on upload start global
            startFile: [], //runs on upload start for the single file
            finish: [], //runs on upload finish success for all files
            finishFile: [], //runs on upload finish success for the single file
            error: [], //runs on error for any file
            errorFile: [], //runs on error upload for single file
            beforeUpload: [], //runs before upload all, if return false then upload is stopped
            beforeUploadFile: [], //runs before the upload of the single if returns false upload is stopped for the single file
            progress: [], //runs on progress action of upload all
            progressFile: [], //runs on file elaboration progress, upload/md5 calc/resize
            beforePreview: [], //runs before preview, if return false stops preview
            preview: [], //runs after preview has been done
            select: [], //runs after file select, returns selected files as parameter of callback
            chunkUpload: [], //runs on a chunk upload
            exifDone: [], //runs once the exifDone has been calculated
            md5Start: [], //runs before starting the md5 calculation
            md5Done: [], //runs once the md5 has been calculated
            beforeImageResize: [], //runs before the resize takes place
            imageResize: [], //runs on image resize done
            dragEnter: [], //runs on drag enter
            dragLeave: [], //run on drag leave
            dragOver: [], //run on drag over
            drop: [],  //run on drop files
            afterRenderFile: [], //run after the file DOM element is attached to the dom
            beforeRenderFile: [] //runs before the file element is beeing rendered to the dom
        };

        //settings filter and validation
        this.preCheckSettings(config);

        // trace slots (parallel uploads), for limiting
        this.slots = this.config.maxConnections;

        //load language and start the singleton
        new _(this.config.language);

        if (this.checkUploadSupport()) {
            //render html
            this.renderHtml();

            //bind click mouse event and other events
            this._bindEvents();

            //run the init call back
            this.triggerEvent('init', []);
        } else {
            //show an alter message or HTML
        }
    };

    RealUploader.prototype = {
        /**
         * Pre-check settings function, sanitize settings and adds getters and setters for future validations
         * @param userSettings settings  define by the user
         * @returns {Object} settings to be used
         */
        preCheckSettings: function (userSettings) {

            var me = this;
            //define some getters and setters for validating settings
            Object.defineProperty(me.config, 'accept', {
                get: function () {
                    return this._data.accept ? this._data.accept : '';
                },
                set: function (val) {
                    this._data.accept = val;
                    me._setAcceptAttribute();
                }
            });

            Object.defineProperty(me.config, 'allowedExtensions', {
                get: function () {
                    return this._data.allowedExtensions;
                },
                set: function (exts) {
                    this._data.allowedExtensions = exts.map(function (item) {
                        return item.toLowerCase();
                    });
                    me._setAcceptAttribute();
                }
            });

            Object.defineProperty(me.config, 'language', {
                get: function () {
                    if (this._data.language == 'auto') {
                        var language = window.navigator.userLanguage || window.navigator.language;
                        return language.replace('-', '_');
                    }
                    return this._data.language;
                },
                set: function (val) {
                    this._data.language = val;
                }
            });

            Object.defineProperty(me.config, 'maxFileSize', {
                get: function () {
                    return this._data.maxFileSize;
                },
                set: function (size) {
                    this._data.maxFileSize = Utils.parseSize(size);
                }
            });

            Object.defineProperty(me.config, 'minFileSize', {
                get: function () {
                    return this._data.minFileSize;
                },
                set: function (size) {
                    this._data.minFileSize = Utils.parseSize(size);
                }
            });

            Object.defineProperty(me.config, 'listeners', {
                get: function () {
                    return this._data.listeners;
                },
                set: function (listeners) {
                    if (typeof listeners == 'object') {
                        for (var event in listeners) {
                            if (listeners.hasOwnProperty(event)) {
                                var callback = listeners[event];
                                me.on(event, callback.fn || callback, callback.scope || me);
                            }
                        }
                        this._data.listeners = listeners;
                    }
                }
            });

            Object.defineProperty(me.config, 'enable', {
                get: function () {
                    return this._data.enable;
                },
                set: function (val) {
                    this._data.enable = !!val;//convert to boolean
                    if (this._data.enable) {
                        me.dom.container.classList.remove('ax-disabled');
                    } else {
                        me.dom.container.classList.add('ax-disabled');
                    }
                }
            });

            //extend config with the default values
            Utils.extend(this.config, this.config._data, false);

            //extend/override config with user settings
            Utils.extend(this.config, userSettings, false);

            Utils.log('Final config', this.config.remotePath);
            return this.config;
        },

        /**
         * Check if the browser supports the HTML5 upload
         * @returns {boolean} true if browser support HTML5
         */
        checkUploadSupport: function () {
            // safari<5.1.7 is bugged in file api force to basic html4 upload
            var isBuggedSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor) && /Version\/5\./.test(navigator.userAgent) && /Win/.test(navigator.platform);
            if (isBuggedSafari || window.FormData === undefined) {
                console.error(_('This browser does not support Ajax Upload'));
                return false;
            }

            //safari on IOS cannot upload multiple files, buggy
            var isBuggedIOS7 = navigator.userAgent.indexOf(" OS 7_") !== -1;
            if (isBuggedIOS7) {
                this.config.maxFiles = 1;
            }
            return true;
        },
        renderHtml: function () {
            //main upload template
            //this template can be overriden with user options
            var tpl = this.config.mainTemplate ? this.config.mainTemplate :
            '<div class="ax-main-container">' +
            '<h5 class="ax-main-title">Select Files or Drag&amp;Drop Files</h5>' +
            '<div class="ax-main-buttons">' +
            '<a title="Add files" class="ax-browse-c ax-button">' +
            '<span class="ax-browse-icon ax-icon"></span> <span class="ax-browse-text ax-text">Add files</span>' +
            '<input type="file" class="ax-browse" multiple />' +
            '</a>' +
            '<a title="Upload all files" class="ax-upload-all ax-button">' +
            '<span class="ax-upload-icon ax-icon"></span> <span class="ax-upload-text ax-text">Start upload</span>' +
            '</a>' +
            '<a title="Remove all" class="ax-clear ax-button">' +
            '<span class="ax-clear-icon ax-icon"></span> <span class="ax-clear-text ax-text">Remove all</span>' +
            '</a>' +
            '</div>' +
            '<div class="ax-file-list"></div>' +
            '</div>';

            //create dom elements and get references
            this.dom.container.classList.add('ax-uploader');
            this.dom.container.innerHTML = tpl;
            var c = this.dom.container;
            this.dom.title = Utils.getEl(c, '.ax-main-title');
            this.dom.browseButton = Utils.getEl(c, '.ax-browse-c');
            this.dom.browseInput = Utils.getEl(c, '.ax-browse');
            this.dom.uploadButton = Utils.getEl(c, '.ax-upload-all');
            this.dom.removeButton = Utils.getEl(c, '.ax-clear');
            this.dom.fileList = Utils.getEl(c, '.ax-file-list');

            if (this.dom.title) {
                this.dom.title.innerHTML = _('Select Files or Drag&Drop Files');
            }

            if (this.dom.browseButton) {
                this.dom.browseButton.setAttribute('title', _('Add files'));
                this.dom.browseButtonText = Utils.getEl(this.dom.browseButton, '.ax-text');
                if (this.dom.browseButtonText) {
                    this.dom.browseButtonText.innerHTML = _('Add files');
                }
            }
            if (this.dom.uploadButton) {
                this.dom.uploadButton.setAttribute('title', _('Upload all files'));
                this.dom.uploadButtonText = Utils.getEl(this.dom.uploadButton, '.ax-text');
                if (this.dom.uploadButtonText) {
                    this.dom.uploadButtonText.innerHTML = _('Start upload');
                }
            }
            if (this.dom.removeButton) {
                this.dom.removeButton.setAttribute('title', _('Remove all'));
                this.dom.removeButtonText = Utils.getEl(this.dom.removeButton, '.ax-text');
                if (this.dom.removeButtonText) {
                    this.dom.removeButtonText.innerHTML = _('Remove all');
                }
            }

            if (this.dom.browseInput) {
                if (this.config.maxFiles != 1) {
                    this.dom.browseInput.setAttribute('multiple', 'multiple');
                }

                this._setAcceptAttribute();

                //experimental feature, works only on google chrome, has some performances issue, upload directory
                if (this.config.uploadDir) {
                    this.dom.browseInput.setAttribute('directory', 'directory');
                    this.dom.browseInput.setAttribute('webkitdirectory', 'webkitdirectory');
                    this.dom.browseInput.setAttribute('mozdirectory', 'mozdirectory');
                }
            }
        },

        /**
         * Set the accept attribute for the input selector, uses allow extensions and accept prop to set it
         * @private
         */
        _setAcceptAttribute: function () {
            var accept = (this.config.accept ? this.config.accept + ',' : '');
            if (this.config.allowedExtensions.length > 0) {
                accept += '.' + this.config.allowedExtensions.join(',.');
            }
            if (this.dom.browseInput && accept) {
                this.dom.browseInput.setAttribute('accept', accept);
            }
        },

        /**
         * Bind the javascript events on the DOM objects
         * @private
         */
        _bindEvents: function () {
            //Add browse event
            var me = this;
            //add the change event for selecting the files from the input
            if (this.dom.browseInput) {
                this.dom.browseInput.addEventListener('change', function () {
                    if (me.config.enable) {
                        //if is supported ajax upload then we have an array of files, if not we have a simple input element with one file
                        me.addFiles(this.files);

                        //chrome change fix event
                        this.value = '';
                    }
                });
            }

            //upload files button
            if (this.dom.uploadButton) {
                this.dom.uploadButton.addEventListener('click', function () {
                    if (me.config.enable) me.enqueueAll();
                    return false;
                });
            }

            //remove all files from list
            if (this.dom.removeButton) {
                this.dom.removeButton.addEventListener('click', function () {
                    if (me.config.enable) me.clearQueue();
                    return false;
                });
            }

            //create/set drop area if is set and if is supported
            var dropArea = null;
            if (me.config.dropArea instanceof HTMLElement) {
                dropArea = me.config.dropArea;
            } else if (me.config.dropArea === 'self') {
                dropArea = this.dom.container;
            } else if (typeof dropArea === 'string') {
                dropArea = Utils.getEl(dropArea);
            } else if (typeof me.config.dropArea === 'function') {
                dropArea = me.config.dropArea.call(this);
            }

            //set the drop area
            this.setDropArea(dropArea);

            //load enable option
            this.enable(this.config.enable);
        },
        /**
         * Function that bind on drop event for the files
         * @param dropArea the dom element where to bind the event
         */
        setDropArea: function (dropArea) {
            if (dropArea && dropArea instanceof HTMLElement) {
                var me = this;
                me.dom.dropMask = Utils.doEl('div');
                me.dom.dropMask.classList.add('ax-mask');
                me.dom.dropMask.innerHTML = '<div class="ax-mask-icon"></div>';
                me.dom.container.appendChild(me.dom.dropMask);

                //control drag events smothly to avoid multiple fires
                var dragEnterRun = false;
                var dragLeaveRun = false;
                var config = this.config;

                var eventStop = function (e) {
                    e.stopPropagation();//Prevent default and stop propagation on dragEnter
                    e.preventDefault();
                };

                /**
                 * Drag Enter can run from all elements so we use the dragEnterRun to avoid multiple run
                 * @param e
                 */
                var dragEnter = function (e) {
                    eventStop(e);
                    if (config.enable && !dragEnterRun) {
                        me.triggerEvent('dragEnter', [e, dropArea]);
                        dragEnterRun = true;
                        dragLeaveRun = false;
                        me.dom.dropMask.style.display = 'table-cell';
                    }
                };

                /**
                 * Event run on drag leave. This Event runs only from the dropMask
                 * @param e event
                 * @param noEvent stop from triggering callbacks
                 */
                var dragLeave = function (e) {
                    eventStop(e);
                    if (config.enable && !dragLeaveRun) {
                        if (config.dropClass) {
                            dropArea.classList.remove(config.dropClass);
                        }
                        me.triggerEvent('dragLeave', [e, dropArea]);
                        dragEnterRun = false;
                        dragLeaveRun = true;
                        me.dom.dropMask.style.display = 'none';
                    }
                };

                /**
                 * Event run on dragover files
                 * @param e
                 */
                var dragOver = function (e) {
                    eventStop(e);
                    if (config.enable) {
                        if (config.dropClass) {
                            dropArea.classList.add(config.dropClass);
                        }
                        me.triggerEvent('dragOver', [e, dropArea]);
                    }
                };

                /**
                 * Event run on drop files
                 * @param e
                 */
                var onDrop = function (e) {
                    eventStop(e);
                    if (config.enable) {
                        me.addFiles(e.dataTransfer.files);//add files
                        if (config.dropClass) {
                            dropArea.classList.remove(config.dropClass);
                        }
                        me.triggerEvent('drop', [e, this]);
                        me.dom.dropMask.style.display = 'none';
                        dragEnterRun = false;
                    }
                };

                //add event listener for the drop area
                dropArea.addEventListener('dragenter', dragEnter);
                me.dom.dropMask.addEventListener('dragleave', dragLeave);
                me.dom.dropMask.addEventListener('dragover', dragOver);
                me.dom.dropMask.addEventListener('drop', onDrop);
            }
        },

        /**
         * Internal function that runs when a file status has been completed, failed or success
         *
         * @param fileId the file ID calling the function
         * @param msg any error message
         * @private
         */
        fileCompleted: function (fileId, msg) {
            //if all files had been uploaded then exec finish event
            var runFinish = true;
            var fileObj = this.fileList[fileId];
            for (var fid in this.fileList) {
                if (this.fileList.hasOwnProperty(fid)) {
                    var f = this.fileList[fid];
                    //so if we have any file still not uploaded do not run finish event
                    if (f.status !== Constants.AX_DONE && f.status !== Constants.AX_ERROR) runFinish = false;
                }
            }

            switch (fileObj.status) {
                case Constants.AX_DONE :
                    this.triggerEvent('finishFile', [fileObj, msg]);
                    break;
                case Constants.AX_ERROR :
                    this.triggerEvent('errorFile', [fileObj, fileObj.getInfo(), fileObj.name]);
                    break;
            }

            //all uploaded files then run final finish event
            if (runFinish) {
                this.finish();
            }

            this.slots++; //free slot
        },

        /**
         * Finish function runs when all files are uploaded, trigger events and returns uploaded file names
         */
        finish: function () {
            this.globalStatus = Constants.AX_DONE;
            var fileNames = []; //collect file names in a array

            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    fileNames.push(this.fileList[fileId].name);
                }
            }
            this.triggerEvent('finish', [fileNames, this.fileList]);
        },

        /**
         * Generate a file id for tracking the files in the list
         * @returns {string}
         */
        generateFileId: function () {
            this.fileIndex++;
            return 'file_' + this.fileIndex;
        },

        /**
         * Add files to the list from select or from drop
         * @param files {array} DOM object list element
         */
        addFiles: function (files) {
            var selectedFiles = [];//store this just for the on select event

            //add selected files to the queue
            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                //normalize extension
                file.extension = file.name.split('.').pop().toLowerCase();

                //check if extension is allowed to be uploaded
                //if we have reach the max number of files allowed
                //if file size is allowed
                var err = this.checkFile(file.name, file.size, file.extension);

                //if no errors add file to list
                if (err.length == 0) {
                    var fileId = this.generateFileId();
                    this.fileList[fileId] = new FileObject(file, fileId, this); //create the file object

                    //store a reference to the current selected files for the onSelect callback
                    selectedFiles.push(this.fileList[fileId]);
                } else {
                    //if there are errors call the error event (if defined from the user)
                    this.triggerEvent('errorFile', [err, file.name]);
                }
            }

            //call the onSelect event, on the selected files
            this.triggerEvent('select', [selectedFiles]);

            //if AutoStart is enabled then start upload MOVE ON FILES READY
            if (this.config.autoStart) {
                this.enqueueAll();
            }
        },

        /**
         * Checking file if extension is allowed or if this file is exceeding the maximum file number
         * @param name name of the file
         * @param size file size (0 on old browser)
         * @param ext file extension
         * @returns {Array} array of error, no errors empty array
         */
        checkFile: function (name, size, ext) {

            var allowedExtensions = this.config.allowedExtensions;
            var fileNumber = Object.keys(this.fileList).length;
            var errors = [];
            var hasUserError = false;

            //check max file number
            var maxFileNumber = fileNumber < this.config.maxFiles;

            //check extension
            var isAllowedExt = allowedExtensions.indexOf(ext) >= 0 || allowedExtensions.length == 0;

            //check file size
            var isSizeAllowed = size <= this.config.maxFileSize;

            //check user validate file function
            if (typeof(this.config.validateFile) === 'function') {
                hasUserError = this.config.validateFile.call(this, name, ext, size);
            }

            if (!maxFileNumber)    errors.push({
                message: _('Maximum files number reached'),
                error: 'MAX_FILES',
                param: fileNumber
            });
            if (!isAllowedExt)    errors.push({
                message: _('Extension not allowed'),
                error: 'ALLOW_EXTENSION',
                param: ext
            });
            if (!isSizeAllowed)    errors.push({message: _('File size now allowed'), error: 'FILE_SIZE', param: size});
            if (hasUserError)    errors.push({message: hasUserError, error: 'USER_ERROR', param: ''});

            return errors;
        },
        /**
         * Function for uploading a single file
         * @param fileId {String}
         */
        enqueueFile: function (fileId) {
            this.uploadQueue.push(this.fileList[fileId]);
            this.processQueue();//trigger a process queue if it is not running already
        },

        /**
         * Enqueue all files ready to upload
         */
        enqueueAll: function () {
            var pending = this.getPendingFiles();

            //on no files callback
            if (pending.length == 0) {
                this.triggerEvent('error', ['NO_FILES', Constants.AX_NO_FILES]);
            } else if (this.triggerEvent('beforeUpload', [this.fileList]) !== false) {
                //on start callback
                this.triggerEvent('start', [pending]);

                //push files in the upload queue
                for (var i = 0, len = pending.length; i < len; i++) {
                    this.uploadQueue.push(pending[i]);
                }

                //trigger a process queue if it is not running already for uploading
                this.processQueue();
            } else {
                this.triggerEvent('error', ['beforeUpload']);
            }
        },

        /**
         * Public alias function for starting upload
         * @public
         */
        startUpload: function () {
            this.enqueueAll();
        },
        /**
         * Internal private function for processing the upload queue, uses quotas
         */
        processQueue: function () {
            var me = this;
            if (!me.checkInterval) {
                Utils.log('Process queue');
                me.checkInterval = setInterval(function () {
                    Utils.log('Start interval');
                    if (me.uploadQueue.length == 0) {
                        clearInterval(me.checkInterval);
                        me.checkInterval = null;
                        Utils.log('No more files. Stop timer.');
                    } else {
                        me.globalStatus = Constants.AX_UPLOADING;
                        for (var i = 0; i < me.uploadQueue.length; i++) {
                            var file = me.uploadQueue[i];
                            if (me.slots > 0 && file.status == Constants.AX_READY && !file.disabled) {
                                var fo = me.uploadQueue.shift();
                                fo.startUpload();//start file upload
                                me.slots--;
                            } else {
                                Utils.log('processQueue:::', file.status, !file.disabled, me.slots);
                            }
                        }
                    }
                }, 500);
            }
        },
        /**
         * Get the pending files ready for upload
         * @returns {Array}
         */
        getPendingFiles: function () {
            var arr = [];
            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    var f = this.fileList[fileId];
                    if (f.status == Constants.AX_READY || f.status == Constants.AX_IDLE || f.status == Constants.AX_CHECK) {
                        arr.push(f);
                    }
                }
            }

            return arr;
        },
        /**
         * Returns true if the uploading process is still running
         * @returns {boolean}
         */
        isUploading: function () {
            return this.globalStatus == Constants.AX_UPLOADING;
        },
        /**
         * Return true if the uploader status is IDLE
         * @returns {boolean}
         */
        isIdle: function () {
            return this.globalStatus == Constants.AX_IDLE;
        },
        /**
         * Helper function for external use for getting the number of the files
         * @returns {boolean}
         */
        hasFiles: function () {
            return Object.keys(this.fileList).length != 0;
        },
        /**
         * Internal function called by the file object
         * @param file the calling file object
         * @param bytes bytes sent to the server
         */
        progress: function (file, bytes) {
            this.total_bytes = +bytes;
            this.triggerEvent('progress', [this.total_bytes]);
        },
        /**
         * Removes and stops all the file from the list and destroys them
         */
        clearQueue: function () {
            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    this.fileList[fileId].destroy();
                }
            }
        },


        /**
         * Get the parameter to pass in POST
         * Returns a formData element
         * @returns {FormData}
         */
        getBaseParams: function (file) {
            Utils.log('getBaseParams:::called');
            //NOTE: all internal params of Real Ajax Uploader starts with ax-
            var config = this.config;
            var data = new FormData();

            //eval file path
            var remotePath = config.remotePath;
            if (typeof remotePath == 'function') {
                remotePath = remotePath.call(this, file);
            }


            //file data
            data.append('ax-file-path', remotePath);
            data.append('ax-allow-ext', config.allowedExtensions.join('|'));
            data.append('ax-max-file-size', config.maxFileSize);

            //thumb data, for generation of thumbs in the server side
            data.append('ax-thumbPostfix', config.thumbPostfix);
            data.append('ax-thumbPath', config.thumbPath);
            data.append('ax-thumbFormat', config.thumbFormat);
            data.append('ax-thumbHeight', config.thumbHeight);
            data.append('ax-thumbWidth', config.thumbWidth);

            //override or not
            if (config.checkFileExists || config.overrideFile) {
                data.append('ax-override', 1);
            }

            //check md5 on server side
            if (config.md5Check && config.md5Calculate) {
                data.append('ax-md5checksum', 1);
            }

            //send and eval user data
            var userData = this.getUserData(config.data, file);

            for (var param in userData) {
                if (userData.hasOwnProperty(param)) {
                    data.append(param, userData[param]);
                }
            }
            return data;
        },
        getUserData: function (userData, file) {
            //send and eval user data
            if (typeof userData === 'function') {
                userData = userData.call(this, file);
            }

            if (typeof userData === 'string') {
                var decode = userData.split('&');
                userData = {};
                for (var i = 0; i < decode.length; i++) {
                    var param = decode[i].split('=');
                    if (param[0] !== undefined && param[1] !== undefined) {
                        userData[param[0]] = param[1];
                    }
                }
            }

            //set a default type
            if (typeof userData !== 'object') {
                userData = {};
            }

            return userData;
        },
        /**
         * This function removes a files from the list
         * Private method to be called only on {FileObject} destroy
         * @param {String} fileId the id of the file in the list to be removed
         * @private
         */
        _removeFile: function (fileId) {
            delete this.fileList[fileId]; //remove the file from the list
        },

        /**
         * Stop all upload
         * @return {RealUploader} return the current object for chain
         * @public
         */
        stopUpload: function () {
            for (var fileId in this.fileList) {
                if (this.fileList.hasOwnProperty(fileId)) {
                    var f = this.fileList[fileId];
                    if (f.status == Constants.AX_UPLOADING) {
                        f.stopUpload();
                    }
                }
            }
            return this;
        },
        /**
         * Enable/Disable the uploader
         * @param bool {Boolean} true enables the uploader/ false disables
         * @return {RealUploader} Returns this for chain purpose
         */
        enable: function (bool) {
            this.config.enable = bool;
            return this;
        },

        /**
         * Bind event function. Use this function to bind one or more listener for any event.
         * Listeners are stored in an array for each type of event
         * @param eventSpace name of the event to trigger: can be namespaced: md5Done.myevent
         * @param callback the function to call
         * @param scope the event scope, by default to this
         * @return {RealUploader} Returns this for chain purpose
         */
        on: function (eventSpace, callback, scope) {
            var splitEvent = eventSpace.split('.');
            var event = splitEvent[0];
            var namespace = splitEvent[1] !== undefined ? splitEvent[1] : '';

            if (this.events[event]) {
                if (!scope) scope = this;
                this.events[event].push([callback, scope, namespace]);
            }
            return this;
        },

        /**
         * Remove specific event from the listeners
         * @param event
         */
        off: function (event) {
            var splitEvent = eventSpace.split('.');
            var event = splitEvent[0];
            var namespace = splitEvent[1] !== undefined ? splitEvent[1] : '';
            if (this.events[event]) {

                //create an array that will hold the event list
                var newEvents = [];

                //iterate through the events name
                for (var i = 0; i < this.events[event].length; i++) {

                    //if the namespace of this event is different from the passed one
                    //then this event should not be removed so store it in the new list
                    //NOTE: that in case name space is not set will be in both cases an empty string
                    if (namespace !== this.events[event][i][2]) {
                        newEvents.push(this.events[event][i]);
                    }
                }

                //this action will remove all the other events
                this.events[event] = newEvents;
            }
        },
        /**
         * Trigger a given event, run all callbacks bind on that event by the "on" function or
         * by the "listeners" property
         * @param event
         * @param params
         * @returns will return the return of the last bind callback return
         */
        triggerEvent: function (event, params) {
            var ret = null;
            if (this.events[event]) {
                Utils.log('triggerEvent', event, params);
                var list = this.events[event];
                for (var i = 0, len = list.length; i < len; i++) {
                    var callback = list[i];
                    ret = callback[0].apply(callback[1], params);
                }
            }
            return ret;
        },
        debugMode: function (env) {
            Constants.ENV = env;
        }
    };

    return RealUploader;
});

    return require('RealUploader');
}));
