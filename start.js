const readline = require('readline');
const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();
const fs = require('fs');
const PNG = require("pngjs").PNG;

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

poweredUP.on("discover", async (hub) => { // Wait to discover a Hub
    console.log(`Discovered ${hub.name}!`);
    await hub.connect(); // Connect to the Hub
    const pencilArm = await hub.waitForDeviceAtPort("D");
    const spinner = await hub.waitForDeviceAtPort("B");
    const lifter = await hub.waitForDeviceAtPort("A");

    console.log("Connected");

    process.stdin.on('keypress', (str, key) => {
        if (key.name === "escape") {
            process.exit();
        }

        (async () => await handleKeyPress(hub, key.name, lifter, spinner, pencilArm))();
    })
});

poweredUP.scan(); // Start scanning for Hubs
console.log("Scanning for Hubs...");

const handleKeyPress = async (hub, keypressed, lifter, spinner, pencilArm) => {
    // console.log(keypressed);
    const pencilPower = 40;
    const spinnerPower = 18;
    const duration = 200;
    const stop = () => {
        // spinner.setPower(0);
        // pencilArm.setPower(0);
        // lifter.setPower(0);
    };

    switch (keypressed) {
        case "left":
            await rotate(spinner, 1, 1);
            break;
        case "right":
            await rotate(spinner, 1, -1);
            break;
        case "up":
            await pencilArm.rotateByDegrees(30, 20);
            break;
        case "down":
            await pencilArm.rotateByDegrees(30, -20);
            break;
        case "n":
            await liftDown(lifter);
            break;
        case "o":
            await liftUp(lifter);
            break;
        case "p":
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
                    line.push(wholeLine[i - 1]);
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

            for (instruction of instructions) {
                switch (instruction.name) {
                    case "step":
                        process.stdout.write(".");
                        await rotate(spinner, Math.abs(instruction.value), instruction.value > 0 ? -1 : 1)
                        break;
                    case "draw":
                        process.stdout.write(".");
                        await draw(lifter);
                        break;
                    case "nextLine":
                        console.log("");
                        await pencilArm.rotateByDegrees(60, -20);
                        break;
                    default:
                        break;
                }
            }
            break;
        case "space":
            await draw(lifter);
        default:
            break;
    }
}

async function rotate(spinner, steps, direction) {
    // (13/4) degrees = ~111 pixels pr. 360 degrees
    await spinner.rotateByDegrees(steps * 13, 10 * direction);
}

async function draw(lifter) {
    await lifter.rotateByDegrees(360, 10);
}

async function liftUp(lifter) {
    await lifter.rotateByDegrees(10, -20);
}

async function liftDown(lifter) {
    await lifter.rotateByDegrees(10, 20);
}
