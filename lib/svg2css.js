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
        dataUris: false,
        svgPath: 'svg/',
        outputPath: 'output/',
        cssPath: 'output/css/',
        cssFileName: 'icons.css',
        colorFile: 'colors.js', // relative to svgPath
        fileSelector: function(filename) {
            return '%Ico-' + filename + ', .Ico-' + filename;
        },
        colorSelector: function(colorKey) {
            return '%Ico--' + colorKey + ', .Ico--' + colorKey;
        }
    };


    _.extend(SVG2CSS.prototype, {
        run: function() {
            this.readColors();
            this.readSVGFiles();
            this.convertFiles();
            this.generateCSS();
        },

        readColors: function() {
            var colorsPath = path.join(this.opts.svgPath, this.opts.colorFile);

            if (!fs.existsSync(colorsPath)) {
                console.log('File doesn\'t exist');
                return;
            }

            this.colorsData = fs.readJSONSync(colorsPath);
            this.allColors = SVG2CSS._getAllColors(this.colorsData);
        },

        getFileColors: function(file) {
            var basename = path.basename(file, '.svg');
            var custom = this.colorsData.custom[basename] || [];
            var defaults = this.colorsData.defaults || ['black'];

            var colorKeys = _.union(defaults, custom);
            var colorValues = _(colorKeys).map(function(colorKey) {
                var colorVal = (this.colorsData.colors && this.colorsData.colors[colorKey]) || colorKey;

                return Color(colorVal).hexString();
            }.bind(this)).value();

            return _.object(colorKeys, colorValues);
        },

        readSVGFiles: function() {
            var svgPath = path.join(this.opts.svgPath);
            var svgOutputPath = path.join(this.opts.outputPath);
            this.files = fs.readdirSync(svgPath)
                .filter(function(file) {
                    if (path.extname(file) === '.svg') return true;
                })
                .map(function(file) {
                    var basename = path.basename(file, '.svg');
                    var colors = this.colorsData.custom[basename] || [];
                    return {
                        basename: basename,
                        path: path.join(svgPath, file),
                        outputPath: path.join(svgOutputPath, file),
                        colors: this.getFileColors(basename)
                    };
                }.bind(this));

            return this;
        },

        convertFiles: function() {
            _(this.files).each(function(file) {
                var svg2prite = new SVG2Sprite(file.path, {
                    spriteCellWidth: this.opts.spriteCellWidth,
                    spriteCellHeight: this.opts.spriteCellHeight,
                    colors: file.colors,
                    colorGrid: this.allColors
                });

                var coloredSVG = svg2prite.colorfy();
                var coloredSVGPath = path.join(this.opts.outputPath, file.basename + '.svg');

                file.coloredSVGPath = coloredSVGPath;
                file.coloredSVG = coloredSVG;

                fs.outputFileSync(coloredSVGPath, coloredSVG);
                console.log('Generated colored SVG file on:', coloredSVGPath);
            }.bind(this));

            return this;
        },

        getCSSBackgroundUrl: function(file) {
            var cssPath = path.join(this.opts.cssPath);

            if (this.opts.dataUris) {
                var data_uri_prefix = "data:image/svg+xml;base64,";
                var image = new Buffer(file.coloredSVG).toString("base64");
                return  data_uri_prefix + image;
            } else {
                return path.relative(cssPath, path.join(file.outputPath));
            }
        },

        generateCSS: function() {
            var cssPath = path.join(this.opts.cssPath);
            var CSS = '';

            _.each(this.files, function(file) {
                var url = this.getCSSBackgroundUrl(file);

                CSS += this.opts.fileSelector(file.basename) + ' {\n' +
                       '    background-image: url("' + url + '");\n' +
                       '}\n\n';
            }, this);

            var idx = 0;
            _.each(this.allColors, function(colorKey) {
                CSS += this.opts.colorSelector(colorKey) + ' {\n' +
                       '    background-position: 0 -' + (idx * 100) + '%;\n' +
                       '}\n\n';
                idx++;
            }, this);

            var cssFullPath = path.join(this.opts.cssPath, this.opts.cssFileName);
            fs.outputFileSync(cssFullPath, CSS);

            console.log('Generated stylesheet on:', cssFullPath);

            return this;
        }
    });


    _.extend(SVG2CSS, {
        _getAllColors: function(colorsData) {
            var all = [
                SVG2CSS._getColors(colorsData.colors),
                SVG2CSS._getDefaultColors(colorsData.defaults),
                SVG2CSS._getCustomColors(colorsData.custom)
            ];

            return _(all).flatten().uniq().value();
        },
        _getColors: function(colors) {
            return _.keys(colors);
        },

        _getDefaultColors: function(defaults) {
            return defaults;
        },

        _getCustomColors: function(files) {
            return _(files).values().flatten().uniq().value();
        }
    });


    module.exports = SVG2CSS;
})();