"use strict";

module.exports = function (options) {
    return {
        img: new RegExp("<\\s*img[^>]*>", "img"),
        src: new RegExp("\\s+src\\s*=\\s*[\"\']([^\"\']+)[\"\']", "im"),
        lazy: new RegExp("\\s+data-lazy\\s*=\\s*[\"\']([^\"\']+)[\"\']", "im"),
        size: new RegExp("(\\s+)(width|height)(?:\\s*=\\s*([\"\'])([^\"\']*)[\"\'])?", "img")
    };
}