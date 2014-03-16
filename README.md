# svg2css

Read SVGs from a directory, creates sprites of each svg with color variations
specified in a separated JSON file, and generates a simple CSS file.

## Installation

Install the module with npm:

    npm install svg2css

## Configuration

- **spriteCellWidth** Type: *Number*. Default: *520*

  The width of each sprite cell

- **spriteCellHeight** Type: *Number*. Default: *520*

  The height of each sprite cell

- **svgPath** Type: *String*. Default: *'svg/'*

  Input folder of SVGs

- **outputPath** Type: *Sring* Default: *'output/'*

  Output folder for SVGs

- **cssPath** Type: *String*. Default: *'output/svg'*

  Path for the generated stylesheet

- **colorFile** Type: *String*. Default: *'colors.js'*
  Path to the JSON file where read the color information for color conversion. The path is relative to `svgPath`.


## Usage

    var svg2css = new SVG2CSS({
        svgPath: 'example/svg/',
        outputPath: 'example/output/',
        cssPath: 'example/output/css/',
        colorFile: 'colors.json' // relative to svgPath
    });


See `example/run.js` for more info.


## License

MIT

