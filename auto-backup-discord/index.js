const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const axios = require('axios');
const FormData = require('form-data');
const config = require('./config.json');

async function archiveFolder(sourceFolder, outputFolder) {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const archiveName = path.join(outputFolder, `archive_${timestamp}.zip`);

    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(archiveName);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve(archiveName));
        archive.on('error', err => reject(err));

        archive.pipe(output);
        archive.directory(sourceFolder, false);
        archive.finalize();
    });
}

async function uploadToDiscord(webhookUrl, filePath) {
    try {
        const file = fs.createReadStream(filePath);
        const form = new FormData();
        form.append('file', file, path.basename(filePath));

        const response = await axios.post(webhookUrl, form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        if (response.status === 200) {
            console.log('Upload Success!');
        } else {
            console.log(`Upload Failed:  ${response.status}`);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

async function main() {
    const { source_folder, output_folder, webhook_url, archive_interval } = config;
    setInterval(async () => {
        try {
            const archivePath = await archiveFolder(source_folder, output_folder);
            console.log(`Folder diarsipkan ke: ${archivePath}`);

            await uploadToDiscord(webhook_url, archivePath);
        } catch (error) {
            console.error('Error:', error);
        }
    }, archive_interval);
}

main();