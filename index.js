import express from 'express';
import Pageres from 'pageres';
import stream from 'stream';
import fs from 'fs';
import yaml from 'js-yaml';

const app = express();
const PORT = 3000;

app.get('/screenshot', async (req, res) => {
    const fileContents = fs.readFileSync('./device-mappings.yaml', 'utf-8');
    const mappings = yaml.load(fileContents);
    const device = mappings.devices[req.query.device];
    if(!device) {
        console.error(`dashboard ${req.query.device} not in allowed list!`);
        res.status(500).send('device not found in configuration list!');
        return;
    }
    const resolution = device.resolution || mappings.default.resolution || '960x540';
    const url = device.url;
    const delayTime = device.delay || mappings.default.delay || 2;
    try {
        // Capture the screenshot with Pageres
        const pageres = new Pageres({ delay: delayTime })
            .source(url, [resolution]);

        const screenshots = await pageres.run();

        if (screenshots.length > 0) {
            const screenshot = screenshots[0]; // Get the first screenshot from the result

            // Create a readable stream from the screenshot buffer
            const readStream = new stream.PassThrough();
            readStream.end(screenshot);

            // Set the response headers and send the screenshot
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Disposition', 'inline; filename="screenshot.png"');
            readStream.pipe(res);
        } else {
            res.status(500).send('No screenshot captured.');
        }
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        res.status(500).send('Failed to capture screenshot.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});