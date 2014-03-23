(function() {

    var SVG2CSS = require('./../lib/svg2css');

    var svg2css = new SVG2CSS({
        dataUris: true,
        svgPath: 'example/svg/',
        outputPath: 'example/output/',
        cssPath: 'example/output/css/',
        colorFile: 'colors.json' // relative to svgPath
    });

    svg2css.run();

})();