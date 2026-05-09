const { promises: fs } = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'source');
const outputDir = path.join(__dirname, 'images');

// Ensure output directory exists
fs.mkdir(outputDir, { recursive: true }).then(async () => {
    const files = await fs.readdir(inputDir);
    const mmdFiles = files.filter(f => f.endsWith('.mmd'));
    
    console.log('Found Mermaid files:', mmdFiles);
    
    for (const file of mmdFiles) {
        console.log(`Processing ${file}...`);
    }
    
    console.log('Note: Run the following command to generate images:');
    console.log('npx -y @mermaid-js/mermaid-cli -i source/*.mmd -o images -t dark');
});