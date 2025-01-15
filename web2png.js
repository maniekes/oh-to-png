#!/usr/bin/env node
import express from 'express';
import Pageres from 'pageres';
import fs from 'fs';
import yaml from 'js-yaml';
import sharp from 'sharp';
import yargs from "yargs";
import {hideBin} from "yargs/helpers";

const app = express();
const yargsInstance = yargs(hideBin(process.argv))
    .scriptName("web2png")
    .usage('Usage: $0 [options]')
    .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Path to the configuration file',
        default: process.env.CONFIG_FILE || './device-mappings.yaml',
    })
    .option('port', {
        alias: 'p',
        type: 'number',
        description: 'Port to run the server on',
        default: process.env.CONFIG_PORT || 3001,
    })
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version')
    .epilog('Author: Rafal Klimonda\nGitHub: https://github.com/maniekes/web2png\nLicense: Apache Commons 2.0')
    .strict()
    .fail((msg, err) => {
        console.error(msg || err);
        yargsInstance.showHelp(); // Use the yargs instance to show the help text
        process.exit(1);
    });
const argv = yargsInstance.argv;

function loadConfig(filePath) {
    const fileContents = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(fileContents);
}

const configPath = argv.config;
const configPort = argv.port;
try {
    loadConfig(configPath);
} catch (error) {
    console.error(`Error loading configuration file(${configPath}):`, error);
    process.exit(1);
}


app.get('/screenshot', async (req, res) => {
    try {
        const mappings = loadConfig(configPath);
        const foundDevice = mappings.devices[req.query.device];
        if (!foundDevice) {
            console.error(`dashboard ${req.query.device} not in allowed list!`);
            res.status(500).send('device not found in configuration list!');
            return;
        }
        console.log(`device: ${JSON.stringify(foundDevice)}`);
        const device = {...mappings.default, ...foundDevice};
        console.log(`defaults: ${JSON.stringify(mappings.default)}`);
        console.log(`device with defaults: ${JSON.stringify(device)}`);
        const resolution = req.query.resolution || device.resolution;
        const delayTime = req.query.delay || device.delay;
        const negate = req.query.negate || device.negate;
        const grayscale = req.query.grayscale || device.grayscale;
        const url = device.url;
        console.log(`[${req.query.device}] fetching ${url} with resolution ${resolution}, delay ${delayTime}, negate ${negate}, grayscale ${grayscale}`);
        console.log(`grayscale ${grayscale} ${typeof grayscale}`);
        console.log(`negate ${negate} ${typeof negate}`);
        // Capture the screenshot with Pageres
        const pageres = new Pageres({delay: delayTime})
            .source(url, [resolution]);

        const screenshots = await pageres.run();
        if (screenshots.length > 0) {
            const buffer = sharp(screenshots[0]);
            if (grayscale) {
                buffer
                    .grayscale()
                    .toFormat('png', {bitdepth: 8});
            }
            if (negate) {
                buffer.negate();
            }
            const processedBuffer = await buffer.toBuffer();
            res.setHeader('Content-Length', processedBuffer.length);
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');

            res.end(processedBuffer);
        } else {
            res.status(500).send('No screenshot captured.');
        }
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        res.status(500).send('Failed to capture screenshot.');
    }
    console.log();
});

app.listen(configPort, () => {
    console.log(`Server running at http://localhost:${configPort}`);
});
