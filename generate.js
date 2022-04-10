const fs = require("pn/fs");
const svg2png = require("svg2png");
const ProgressBar = require("progress");
const sharp = require("sharp");

const sizes = [1, 1.25, 1.5, 1.75, 2, 2.5, 3, 5, 10];

const height = 32;

const queue = [];

let flags = 0;

console.log("🗺️\ttaiga flaggi generation tool");

console.log("📦\tStarting preparation steps...");

let prepBar = new ProgressBar("[:bar] :current/:total | :percent | ~:etas remaining | :elapseds elapsed", {
    total: 5,
    width: 30,
    complete: "█",
    incomplete: "░",
    clear: true,
});

// Create png output directory
if (!fs.existsSync("png")) fs.mkdirSync("png");
prepBar.tick();

// Create webp output directory
if (!fs.existsSync("webp")) fs.mkdirSync("webp");
prepBar.tick();

// Create png output size directories
sizes.forEach((size) => {
    if (!fs.existsSync(`png/${size}`)) fs.mkdirSync(`png/${size}`);
});
prepBar.tick();

// Create webp output size directories
sizes.forEach((size) => {
    if (!fs.existsSync(`webp/${size}`)) fs.mkdirSync(`webp/${size}`);
});
prepBar.tick();

// Populate queue
fs.readdirSync("svg").forEach((file) => {
    if (!file.endsWith(".svg")) return;
    const name = file.replace(".svg", "");

    flags++;

    sizes.forEach((size) => {
        queue.push({
            name,
            size,
        });
    });
});
prepBar.tick();

const elapsed = new Date() - prepBar.start;
const elapsedString = isNaN(elapsed) ? "0.0" : (elapsed / 1000).toFixed(1);

console.log(`⏱️\tCompleted preparation in ${elapsedString}s! Starting generation...`);

console.log(`🖼️\tGenerating PNG files for ${flags} flags... (It may take a short while for generation to start!)`);

let bar = new ProgressBar("[:bar] :current/:total | :percent | ~:etas remaining | :elapseds elapsed", {
    total: queue.length,
    width: 30,
    complete: "█",
    incomplete: "░",
    clear: true,
});

queue.forEach((item) => {
    fs.readFile(`svg/${item.name}.svg`).then((svg) => {
        svg2png(svg, { height: height * item.size }).then((png) => {
            fs.writeFile(`png/${item.size}/${item.name}.png`, png).then(() => {
                bar.tick();
                if (bar.complete) {
                    const elapsed = new Date() - bar.start;
                    const elapsedString = isNaN(elapsed) ? "0.0" : (elapsed / 1000).toFixed(1);
                    console.log(
                        `🖼️\tSuccessfully generated ${queue.length} PNG files in ${elapsedString}s. (${flags} flags in ${sizes.length} sizes)`
                    );
                    initWebpGeneration();
                }
            });
        });
    });
});

function initWebpGeneration() {
    console.log(`🌐\tGenerating WEBP files for ${flags} flags...`);

    let webpBar = new ProgressBar("[:bar] :current/:total | :percent | ~:etas remaining | :elapseds elapsed", {
        total: queue.length,
        width: 30,
        complete: "█",
        incomplete: "░",
        clear: true,
    });

    queue.forEach((item) => {
        fs.readFile(`png/${item.size}/${item.name}.png`).then((png) => {
            sharp(png)
                .toFile(`webp/${item.size}/${item.name}.webp`)
                .then(() => {
                    webpBar.tick();
                    if (webpBar.complete) {
                        const elapsed = new Date() - webpBar.start;
                        const elapsedString = isNaN(elapsed) ? "0.0" : (elapsed / 1000).toFixed(1);
                        const fullElapsed = new Date() - bar.start + (new Date() - webpBar.start);
                        const fullElapsedString = isNaN(fullElapsed) ? "0.0" : (fullElapsed / 1000).toFixed(1);
                        console.log(
                            `🌐\tSuccessfully generated ${queue.length} WEBP files in ${elapsedString}s. (${flags} flags in ${sizes.length} sizes)`
                        );
                        console.log(`🎉\tGenerated ${queue.length * 2} PNG & WEBP files in ${fullElapsedString}s.`);
                    }
                });
        });
    });
}
