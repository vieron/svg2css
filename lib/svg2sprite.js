(function() {

    'use strict';

    var fs = require('fs-extra');
    var path = require('path');
    var _ = require('lodash');
    var xml2js = require('xml2js');
    var builder = new xml2js.Builder();
    var parseString = xml2js.parseString;
    var SVGO = require('svgo');
    var svgo = new SVGO();


    function SVG2Sprite(svgFilePath, options) {
        this.opts = _.extend({}, SVG2Sprite.defaults, options);

        this.filePath = path.join(svgFilePath);
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
        colors: [],
        colorGrid: []
    };


    _.extend(SVG2Sprite.prototype, {
        colorfy: function() {
            var svg;
            var fileContent = fs.readFileSync(this.filePath, 'utf8');

            if (!fileContent) {
                return console.log('No file content');
            }

            var basename = path.basename(this.filePath, '.svg');
            var colors = this.opts.colors;
            var grid = this.opts.colorGrid;

            var allSVGs = _(colors).map(function(colorVal, colorKey) {
                var className = basename + '-' + colorKey;
                var paths = ['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'text'];
                var rules = _.map(paths, function(path) { return '.' + className + ' ' + path; }).join(', ');
                var coloredSVG = fileContent.replace(/<svg/im, '<svg class="' + className + '"').replace(/^(<svg[^>]+>)/im, '$1<defs><style type="text/css"> ' + rules + ' { fill: ' + colorVal + ' !important; }</style></defs>' );

                return {
                    colorKey: colorKey,
                    fileContent: coloredSVG
                };
            }).value();

            var iconHeight = this.opts.spriteCellHeight;

            _.each(allSVGs, function(file) {
                parseString(file.fileContent, function (err, parsedFileContent) {
                    // var iconHeight = parseInt(parsedFileContent.svg.$.height);
                    var iconWidth = parseInt(parsedFileContent.svg.$.width, 10);
                    var layout_idx = _.indexOf(grid, file.colorKey);

                    // add icon in correspondent layout position
                    parsedFileContent.svg.$.y = layout_idx * iconHeight;
                    this.y += iconHeight;

                    // sprite is vertical
                    parsedFileContent.svg.$.x = 0;

                    // add current icon object to resulting sprite object
                    this.sprite.svg.svg.push(parsedFileContent.svg);
                }.bind(this));
            }.bind(this));

            // resultant svg height
            this.height = (_.size(grid) + 1) * iconHeight;
            this.sprite.svg.$.height = this.height;
            this.sprite.svg.$.width = this.opts.spriteCellWidth;

            svgo.optimize(builder.buildObject(this.sprite), function(res) {
                svg = res.data;
            });

            return svg;
        }
    });



    module.exports = SVG2Sprite;
})();