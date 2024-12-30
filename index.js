import express from 'express';
import Pageres from 'pageres';
import stream from 'stream';

const app = express();
const PORT = 3000;

app.get('/screenshot', async (req, res) => {
    const url = req.query.url || 'https://example.com'; // URL to capture
    const resolution = req.query.resolution || '960x540'; // Resolution

    try {
        // Capture the screenshot with Pageres
        const pageres = new Pageres({ delay: 2 })
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