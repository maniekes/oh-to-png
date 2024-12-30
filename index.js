import express from 'express';
import Pageres from 'pageres';
import stream from 'stream';
import dotenv from 'dotenv';

const env = process.env.NODE_ENV || 'production';
dotenv.config({ path: `.env.${env}` });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const OH_HOST = process.env.OH_HOST;
const OH_RESOLUTION = process.env.OH_RESOLUTION || '960x540';
const OH_KIOSK = process.env.OH_KIOSK || true;
const dashboards = process.env.OH_ALLOWED_DASHBOARDS.split(',') || [];
const kioskMode = OH_KIOSK ? '&kiosk=on' : '';

app.get('/screenshot', async (req, res) => {
    const resolution = req.query.resolution || OH_RESOLUTION;
    if(!dashboards.includes(req.query.dashboard)) {
        console.error(`dashboard ${req.query.dashboard} not in allowed list!`);
        res.status(500).send('dashboard not in allowed list!');
        return;
    }
    const url = `${OH_HOST}${req.query.dashboard}?${kioskMode}`
    const delayTime = req.query.delay || 2;

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