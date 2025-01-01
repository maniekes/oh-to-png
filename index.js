import express from 'express';
import Pageres from 'pageres';
import fs from 'fs';
import yaml from 'js-yaml';
import sharp from 'sharp';

const app = express();
const PORT = 3001;

app.get('/screenshot', async (req, res) => {
    const fileContents = fs.readFileSync('./device-mappings.yaml', 'utf-8');
    const mappings = yaml.load(fileContents);
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
    try {
        // Capture the screenshot with Pageres
        const pageres = new Pageres({ delay: delayTime })
            .source(url, [resolution]);

        const screenshots = await pageres.run();
        if (screenshots.length > 0) {
            const buffer = sharp(screenshots[0]);
            if(grayscale) {
                buffer
                .grayscale()
                .toFormat('png', { bitdepth: 8 });
            }
            if(negate) {
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

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});