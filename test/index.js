"use strict";

var
    Lab = require('lab'),
    lab = exports.lab = Lab.script();

var
    suite = lab.suite,
    test = lab.test,
    before = lab.before,
    after = lab.after,
    expect = Lab.expect;

var chalk = require('chalk');

lab.experiment("RegExp", function () {
    var REG;
    lab.beforeEach(function (done) {
        REG = require('../lib/regexp')();
        done();
    });
    // img tag tests
    lab.test("img tag - normal", function (done) {
        expect(REG.img.test('<img>')).to.equal(true);
        done();
    });
    lab.test("img tag - normal - closed", function (done) {
        expect(REG.img.test('<img />')).to.equal(true);
        done();
    });
    lab.test("img tag - multiline", function (done) {
        expect(REG.img.test('<img\n>')).to.equal(true);
        done();
    });
    lab.test("img tag - multiline - closed", function (done) {
        expect(REG.img.test('<img\n/>')).to.equal(true);
        done();
    });
    // src attribute tests
    lab.test("src - blank", function (done) {
        expect(REG.src.test('<img src="" />')).to.equal(false);
        done();
    });
    lab.test("src - normal", function (done) {
        expect(REG.src.test('<img src="http://www.example.com" />')).to.equal(true);
        done();
    });
});

lab.experiment("imgsizefix test", function () {
    var imgsizefix = require('../lib'),
        path = __dirname + '/index.html',
        html = require('./utils').generatePatterns().join('\n'),
        options = {
            paths: {
                "test/": [
                    new RegExp("^\\/\\/[^\\/]+"),
                    new RegExp("^\\/"),
                    "http://example.com"
                ]
            },
            force: true,
            debug: false
        };

    lab.test('sync test', function (done) {
        var result = imgsizefix.sync(html, path, options);
        // console.log(result);
        if (result) {
            done();
        } else {
            done('error');
        }
    });

    lab.test('async test', function (done) {
        imgsizefix(html, path, options,
            function (error, result) {
                // console.log(result);
                if (!error && result) {
                    done();
                } else {
                    done('error');
                }
            }
        );
    });
});

lab.experiment("imgsizefix transform test", function () {
    var imgsizefix = require('../lib'),
        path = __dirname + '/index.html',
        patterns, src, dest;

    lab.before(function (done) {
        patterns = require('./utils').generatePatterns();
        var inherits = require('util').inherits,
            stream = require('stream'),
            fs = require('fs');

        src = new stream.Readable();
        dest = fs.createWriteStream(path);
        src._read = function (size) {}
        done();
    });

    lab.test('multi push test', function (done) {
        src
            .pipe(imgsizefix.transform({
                paths: {
                    "test/": [
                        new RegExp("^\\/\\/[^\\/]+"),
                        new RegExp("^\\/"),
                        "http://example.com"
                    ]
                },
                force: true,
                debug: false
            }))
            .pipe(dest);
        dest.on('unpipe', function () {
            done();
        });
        patterns.forEach(function (pattern) {
            src.push(pattern + '\n', 'utf8');
        });
        src.push(null);
    });
});