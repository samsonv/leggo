const readline = require('readline');
const PoweredUP = require("node-poweredup");
const poweredUP = new PoweredUP.PoweredUP();
const fs = require('fs');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
const _self = this;
_self.spinnerSpeed = 0;
_self.pencilArmSpeed = 0;
_self.color = 0;
_self.steps = 0;

poweredUP.on("discover", async (hub) => { // Wait to discover a Hub
    console.log(`Discovered ${hub.name}!`);
    await hub.connect(); // Connect to the Hub
    const pencilArm = await hub.waitForDeviceAtPort("D");
    const spinner = await hub.waitForDeviceAtPort("B");
    const lifter = await hub.waitForDeviceAtPort("A");
    const sensor = await hub.waitForDeviceAtPort("C");

    console.log("Connected");

    sensor.on("color", (c) => {
        if (Math.abs(c.color - _self.color) > 5) {
            _self.steps += 1;
            console.log("Steps: " + _self.steps);
            _self.color = c.color;
        }
    });

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
    console.log(keypressed);
    const pencilPower = 40;
    const spinnerPower = 40;
    const duration = 500;
    const stop = () => {
        spinner.setPower(0);
        pencilArm.setPower(0);
        lifter.setPower(0);
    };

    switch (keypressed) {
        case "left":
            await moveSpinner(spinner, spinnerPower, hub, stop, 1);
            await hub.sleep(duration);
            stop();
            break;
        case "right":
            await moveSpinner(spinner, -spinnerPower, hub, stop, 1);
            break;
        case "up":
            pencilArm.setPower(pencilPower);
            await hub.sleep(duration);
            stop();
            break;
        case "down":
            pencilArm.setPower(-pencilPower);
            await hub.sleep(duration);
            stop();
            break;
        case "n":
            lifter.setPower(20);
            await hub.sleep(200);
            stop();
            break;
        case "o":
            lifter.setPower(-25);
            await hub.sleep(200);
            stop();
            break;
        case "p":
            let rawdata = fs.readFileSync('test.json');
            let drawing = JSON.parse(rawdata);
            console.log("Will draw: (" + drawing.width + " x " + drawing.height + "):");
            for (let y = 0; y < drawing.height; y++) {
                var line = "";
                for (let x = 0; x < drawing.width; x++) {
                    line += drawing.layers[0].data[x + (y * drawing.width)] === 0 ? " " : "X";
                }
                console.log(line);
            }
            for (let y = 0; y < drawing.height; y++) {
                const flip = y % 2 != 0;
                for (let x = 0; x < drawing.width; x++) {
                    let index = flip
                        ? (y * drawing.width + (drawing.width - (x + 1)))
                        : x + (y * drawing.width);

                    var shouldDraw = drawing.layers[0].data[index] != 0;
                    process.stdout.write(shouldDraw ? "." : "_");

                    if (shouldDraw) {
                        lifter.setPower(30);
                        await hub.sleep(300);
                        stop();
                        await hub.sleep(100);
                        lifter.setPower(-30);
                        await hub.sleep(300);
                        stop();
                    } else {
                        await hub.sleep(50);
                    }
                    if (drawing.width - 1 != x) {
                        await moveSpinner(spinner, flip ? 30 : -30, hub, stop, 1);
                    }
                }
                console.log("");
                if (drawing.height - 1 != y) {
                    pencilArm.setPower(-pencilPower);
                    await hub.sleep(duration * 3);
                    stop();
                }
            }
            break;
        case "space":
            lifter.setPower(40);
            await hub.sleep(150);
            lifter.setPower(-40);
            await hub.sleep(150);
            stop();
        default:
            break;
    }
}

const handleKeyPressTwo = async (hub, keypressed, lifter, spinner, pencilArm) => {
    switch (keypressed) {
        case "left":
            _self.spinnerSpeed -= 10;
            break;
        case "right":
            _self.spinnerSpeed += 10;
            break;
        case "down":
            _self.pencilArmSpeed += 10;
            break;
        case "up":
            _self.pencilArmSpeed -= 10;
            break;
        case "n":
            lifter.setPower(25);
            await hub.sleep(200);
            lifter.setPower(0);
            break;
        case "o":
            lifter.setPower(-25);
            await hub.sleep(200);
            lifter.setPower(0);
            break;
        case "space":
            _self.spinnerSpeed = 0;
            _self.pencilArmSpeed = 0;
            break;
        default:
            console.log(keypressed);
            break;
    }

    spinner.setPower(_self.spinnerSpeed);
    pencilArm.setPower(_self.pencilArmSpeed);
    console.log("spinner", _self.spinnerSpeed);
    console.log("pencil", _self.pencilArmSpeed);
}

async function moveSpinner(spinner, spinnerPower, hub, stop, steps) {
    _self.steps = 0;
    spinner.setPower(spinnerPower);
    // await hub.sleep(duration);
    while (_self.steps < steps) {
        await hub.sleep(5);
    }
    stop();
}

