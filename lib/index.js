"use strict";

var async = require('async'),
    Path = require('path'),
    Parser = require('imagesize').Parser,
    regexp = require('./regexp'),
    imgsizefix = function (html, path, options, callback) {
        html = html.toString();
        path = Path.resolve(path);
        options = options || {};

        var dirname = Path.dirname(path),
            REG = regexp(options),
            caches = {},
            replaces = options.resolve || options.paths || {},
            force = options.force || false,
            filter = options.filter || null,
            debug = options.debug || false,
            chalk = debug ? require('chalk') : null;

        function resolveSrc(src) {
            var resolved = Object.keys(replaces).some(function (localPath) {
                var fullPath = Path.resolve(localPath) + "/";
                return replaces[localPath].some(function (replacer) {
                    if (!src.match(replacer)) {
                        return false;
                    }
                    src = src.replace(replacer, fullPath);
                    src = Path.normalize(src);
                    return true;
                });
            });
            return resolved ? src : Path.join(dirname, src);
        }

        function existsAttribute(img) {
            var exists = {
                width: false,
                height: false
            };
            /*jslint unparam: true */
            img = img.replace(REG.size, function (match, before, name, bracket, value, index, all) {
                if (isNaN(value) ? value === 'auto' : true) {
                    exists[name] = value;
                } else {
                    exists[name] = true;
                }
                return match;
            });
            /*jslint unparam: false */
            return exists;
        }

        function fillAttribute(img) {
            var exists = existsAttribute(img);
            if (exists.width === false) {
                img = img.replace(/\s*(\/?>)/im, ' width$1');
            }
            if (exists.height === false) {
                img = img.replace(/\s*(\/?>)/im, ' height$1');
            }
            return img;
        }

        function readSize(src) {
            var cached = caches[src];
            if (cached) {
                return cached;
            }

            try {
                var parser = new Parser(),
                    imgdata = require('fs').readFileSync(src);
                if (parser.parse(imgdata) !== Parser.DONE) {
                    throw new Error();
                }
                cached = caches[src] = parser.getResult();
            } catch (error) {
                cached = caches[src] = {
                    width: 'auto',
                    height: 'auto'
                };
            }
            return cached;
        }

        function readSizeAsync(src, callback) {
            var cached = caches[src];
            if (cached) {
                process.nextTick(function () {
                    callback(null, cached);
                });
                return;
            }

            caches[src] = true;

            try {
                require('fs').readFile(src, function (error, imgdata) {
                    var parser = new Parser();
                    if (error || parser.parse(imgdata) !== Parser.DONE) {
                        throw new Error('not found : ' + src);
                    }
                    cached = caches[src] = parser.getResult();
                    callback(null, cached);
                });
            } catch (error) {
                cached = caches[src] = {
                    width: 'auto',
                    height: 'auto'
                };
                process.nextTick(function () {
                    callback(null, cached);
                });
            }
        }

        function execute() {
            return html.replace(REG.img, function (img) {
                if (debug) {
                    console.log('--------');
                    console.log(chalk.red(img));
                }

                var exists = existsAttribute(img);
                if (typeof exists.width !== 'boolean' && typeof exists.height !== 'boolean') {
                    return img;
                }

                var src = src = (REG.lazy.exec(img) || REG.src.exec(img) || [])[1];
                if (!src) {
                    return img;
                }

                // FIXME: Duplicated resolve
                src = resolveSrc(src);

                var size = readSize(src);

                if (debug) {
                    console.log(chalk.green(img));
                }

                if (force) {
                    img = fillAttribute(img);
                }

                /*jslint unparam: true */
                img = img.replace(REG.size, function (match, before, name, bracket, value, index, all) {
                    if (bracket && value.indexOf('$') < 0) {
                        return match;
                    }
                    bracket = bracket || '"';
                    value = size[name];
                    if (filter) {
                        value = filter(path, name, value);
                    }
                    return [before, name, '=', bracket, value, bracket].join('');
                });
                /*jslint unparam: false */

                if (debug) {
                    console.log(img);
                }

                return img;
            });
        }

        if (typeof callback === 'function') {
            var imgMatches = null,
                img, src, srcs = [];
            while (imgMatches = REG.img.exec(html)) {
                img = imgMatches[0];

                var exists = existsAttribute(img);
                if (typeof exists.width !== 'boolean' && typeof exists.height !== 'boolean') {
                    continue;
                }

                src = (REG.lazy.exec(img) || REG.src.exec(img) || [])[1];
                if (!src) {
                    continue;
                }
                src = resolveSrc(src);
                if (srcs.indexOf(src) < 0) {
                    srcs.push(src);
                }
            }
            // console.log(srcs);
            async.map(srcs, readSizeAsync, function (error, result) {
                callback(null, execute());
            });
        } else {
            return execute();
        }
    };

module.exports = function (html, path, options, callback) {
    if (typeof path !== 'string') {
        callback = options;
        options = path;
        path = html;
        html = require('fs').readFileSync(path);
    }
    if (typeof callback !== 'function') {
        throw new Error('async call required `callback`.');
    }
    imgsizefix(html, path, options, callback);
}

module.exports.sync = function (html, path, options) {
    if (typeof path !== 'string') {
        options = path;
        path = html;
        html = require('fs').readFileSync(path);
    }
    return imgsizefix(html, path, options);
}

module.exports.transform = function (options) {
    var stream = require('stream'),
        transform = new stream.Transform({
            objectMode: true
        });
    transform._transform = function (chunk, encoding, done) {
        if (!this.readable) {
            this.push(chunk, encoding);
        } else {
            var path = this._readableState.pipes.path;
            this.push(
                imgsizefix(chunk, path, options),
                encoding
            );
        }
        done();
    };
    return transform;
};