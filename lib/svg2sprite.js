(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var _ = require('lodash');
    var xml2js = require('xml2js');
    var builder = new xml2js.Builder();
    var parseString = xml2js.parseString;



    function SVG2Sprite(options) {
        this.opts = _.extend({}, SVG2Sprite.defaults, options);

        // initial position of each icon in the sprite
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;

        // the resulting sprite object
        this.sprite = {
            svg: {
                svg: [],
                $: { xmlns: 'http://www.w3.org/2000/svg' }
            }
        };
    }


    SVG2Sprite.defaults = {
        spriteCellWidth: 600,
        spriteCellHeight: 600,
        colorVariations: [],
        colorsData: {},
        svgPath: 'svg/',
        outputPath: 'output/',
        spriteName: 'sprite.svg',
        cssPath: 'output/',
        colorFile: 'colors.js' // relative to svgPath
    };


    _.extend(SVG2Sprite.prototype, {

        colorfy: function(filePath, callback) {
            var self = this;

            if (path.extname(filePath) !== '.svg') return;

            if (!this.opts.colorVariations) return;

            var basename = path.basename(filePath, '.svg');

            var fileContent = fs.readFileSync(filePath, 'utf8');
            if (!fileContent) {
                return console.log('No file content');
            }

            var colorsData = this.opts.colorsData;
            var allSVGs = [{
                colorKey: 'default',
                fileContent: fileContent
            }];

            _.each(this.opts.colorVariations, function(colorKey, i) {
                var colorData = colorsData[colorKey];
                if (! colorData) {
                    console.log('There is no color config for: ' + colorKey);
                }

                var j = i + 2;
                var className = basename + '-' + colorKey + '-' + j;
                var paths = ['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'text'];
                var rules = _.map(paths, function(path) { return '.' + className + ' ' + path; }).join(', ');
                // var rules = paths.join(', ');
                var coloredSVG = fileContent.replace(/<svg/im, '<svg class="' + className + '"').replace(/^(<svg[^>]+>)/im, '$1<defs><style type="text/css"> ' + rules + ' { fill: ' + colorData.hexColor + ' !important; }</style></defs>' );

                allSVGs.push({
                    colorKey: colorKey,
                    fileContent: coloredSVG
                });
            }, this);

            var iconHeight = this.opts.spriteCellHeight;

            _.each(allSVGs, function(fileData) {
                parseString(fileData.fileContent, function (err, parsedFileContent) {
                    var isOriginal = fileData.colorKey === 'default';
                    // var iconHeight = parseInt(parsedFileContent.svg.$.height);

                    var iconWidth = parseInt(parsedFileContent.svg.$.width, 10);
                    var layout_idx = isOriginal ? 0 : colorsData[fileData.colorKey].index;

                    // set sprite width to widest icon's width
                    if (self.width < iconWidth) {
                        self.width = iconWidth;
                        self.sprite.svg.$.width = self.width;
                    }

                    // add icon in correspondent layout position
                    parsedFileContent.svg.$.y = layout_idx * iconHeight;
                    self.y += iconHeight;

                    // sprite is vertical
                    parsedFileContent.svg.$.x = 0;

                    // add current icon object to resulting sprite object
                    self.sprite.svg.svg.push(parsedFileContent.svg);
                });
            });

            // resultant svg height
            self.height = (_.size(colorsData) + 1) * iconHeight;
            self.sprite.svg.$.height = self.height;


            return this.generateSprite(callback);
        },

        generateSprite: function(callback) {
            // build xml from resulting sprite object
            var resultSprite = builder.buildObject(this.sprite);
            var spritePath = path.join(this.opts.outputPath, this.opts.spriteName);

            var result = fs.outputFileSync(spritePath, resultSprite);
            console.log('Generated sprite on:', spritePath);

            return result;
        }
    });


    module.exports = SVG2Sprite;
})();