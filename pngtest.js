const fs = require("fs");
const PNG = require("pngjs").PNG;

let data = fs.readFileSync('test.png');
let image = PNG.sync.read(data);
let pixelArray = [...image.data];
console.log("Will draw: (" + image.width + " x " + image.height + "):");
let xpos = 1;
let instructions = [];
for (let y = 0; y < image.height; y++) {
    let wholeLine = pixelArray.slice(y * image.width * 4, y * 4 * image.width + image.width * 4);
    var line = [];
    for (i = 4; i < wholeLine.length; i = i + 4) {
        line.push(wholeLine[i-1]);
    }

    console.log(line.map((l) => l == 0 ? " " : "█").join(""));
    if (line.some(x => x !== 0)) {
        let skipLines = 0;
        for (let x = 0; x < line.length; x++) {
            const pixel = line[x];
            if (pixel == 0) {
                skipLines++;
            } else {
                skipLines++;
                if ((skipLines - xpos) != 0) {
                    instructions.push({ "name": "step", "value": (skipLines - xpos) });
                }
                instructions.push({ "name": "draw", "value": null });
                xpos = x + 1;
            }
        }
    }
    if (y < image.height - 1) {
        instructions.push({ "name": "nextLine", "value": null });
    }
}