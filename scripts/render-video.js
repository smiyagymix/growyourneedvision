
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

// This script is a standalone renderer for Remotion videos.
// It is intended to be run in a Node.js environment.

async function renderVideo(compositionId, outputFormat = 'mp4', quality = 'medium', inputProps = {}) {
    console.log('Starting render...');

    try {
        // Step 1: Bundle the Remotion project
        console.log('Bundling...');
        const bundleLocation = await bundle({
            entryPoint: path.resolve(__dirname, '../src/index.tsx'), // Adjust path as needed
            webpackOverride: (config) => config,
        });

        // Step 2: Select the composition
        console.log('Selecting composition...');
        const composition = await selectComposition({
            serveUrl: bundleLocation,
            id: compositionId,
            inputProps,
        });

        // Step 3: Define output path
        const timestamp = Date.now();
        const filename = `video-${timestamp}.${outputFormat}`;
        const outputPath = path.resolve(__dirname, `../exports/${filename}`);

        // Ensure exports directory exists
        if (!fs.existsSync(path.dirname(outputPath))) {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        }

        // Step 4: Render the video
        console.log('Rendering...');
        await renderMedia({
            composition,
            serveUrl: bundleLocation,
            codec: outputFormat === 'mp4' ? 'h264' : (outputFormat === 'webm' ? 'vp8' : 'gif'),
            outputLocation: outputPath,
            inputProps,
            quality: quality === 'low' ? 50 : (quality === 'high' ? 95 : 75),
        });

        console.log(`Render complete: ${outputPath}`);
        return outputPath;

    } catch (error) {
        console.error('Render failed:', error);
        throw error;
    }
}

// Example usage if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    const compositionId = args[0] || 'MyComposition';
    renderVideo(compositionId).catch(err => process.exit(1));
}

module.exports = { renderVideo };
