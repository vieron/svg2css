(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var _ = require('lodash');
    var Color = require('color');
    var SVG2Sprite = require('./svg2sprite');


    function SVG2CSS(options) {
        this.opts = _.extend({}, SVG2CSS.defaults, options);
    }


    SVG2CSS.defaults = {
        spriteCellWidth: 512,
        spriteCellHeight: 512,
        svgPath: 'svg/',
        outputPath: 'output/',
        cssPath: 'output/css/',
        colorFile: 'colors.js' // relative to svgPath
    };


    _.extend(SVG2CSS.prototype, {
        copyToOutput: function() {
            fs.copySync(path.join(this.opts.svgPath),
                path.join(this.opts.outputPath));

            console.log('SVG files copied');

            return this;
        },

        // should be called after copy_to_output
        readColorData: function() {
            var colorsPath = path.join(this.opts.svgPath, this.opts.colorFile);

            if (!fs.existsSync(colorsPath)) {
                console.log('File doesn\'t exist');
                return;
            }

            this.colorConf = fs.readJSONSync(colorsPath);

            return this;
        },

        readSVGDir: function() {
            var svgPath = path.join(this.opts.outputPath);
            this.files = fs.readdirSync(svgPath)
                .map(function(file) {
                    return path.join(svgPath, file);
                })
                .filter(function(file){
                    if (path.extname(file) === '.svg') return true;
                });

            return this;
        },

        extractColors: function() {
            var uniqueColors = {};
            var i = 1;
            _.each(this.colorConf, function(colors, basename) {
                _.each(colors, function(rawColor, colorKey) {
                    if (! uniqueColors[colorKey]) {
                        uniqueColors[colorKey] = {
                            index: i++,
                            hexColor: Color(rawColor).hexString(),
                            rawColor: rawColor
                        };
                    }
                });
            });

            this.colors = uniqueColors;

            return this;
        },

        toSprite: function(callback) {

            _.each(this.colorConf, function(colors, basename) {
                var file = path.join(this.opts.svgPath, basename + '.svg');
                var originalSVG = fs.readFileSync(file).toString('utf-8');

                var colorKeys = _.keys(colors);

                this.svg2sprite = new SVG2Sprite(_.extend({}, this.opts, {
                    spriteName: basename + '.svg',
                    colorVariations: colorKeys,
                    colorsData: this.colors
                }));

                this.svg2sprite.colorfy(file, callback);

            }, this);

            return this;
        },

        toCSS: function() {
            this.readSVGDir();
            var cssPath = path.join(this.opts.cssPath);
            var CSS = '';

            _.each(this.files, function(svgPath) {
                var relativePath = path.relative(cssPath, path.join(svgPath));
                CSS += '.Ico-' + path.basename(svgPath, '.svg') + ' {\n' +
                       '    background-image: url("' + relativePath + '");\n' +
                       '}\n\n';

            }, this);

            var idx = 1;
            _.each(this.colors, function(colorData, colorKey) {
                CSS += '.Ico--' + colorKey.toLowerCase() + ' {\n' +
                       '    background-position: 0 -' + (idx * 100) + '%;\n' +
                       '}\n\n';
                idx++;
            }, this);

            var cssOutputPath = path.join(this.opts.cssPath, 'icons.css');
            fs.outputFileSync(cssOutputPath, CSS);

            console.log('Generated stylesheet on:', cssOutputPath);

            return this;
        }

    });


    module.exports = SVG2CSS;
})();