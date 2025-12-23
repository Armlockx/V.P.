const https = require('https');
const fs = require('fs');
const path = require('path');

async function generateCatImage() {
    return new Promise((resolve, reject) => {
        const url = 'https://api.thecatapi.com/v1/images/search?size=full';
        
        https.get(url, (response) => {
            let data = '';
            
            response.on('data', (chunk) => {
                data += chunk;
            });
            
            response.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    const imageUrl = jsonData[0].url;
                    
                    // Extract file extension from URL
                    const urlParts = imageUrl.split('.');
                    const extension = urlParts[urlParts.length - 1].split('?')[0];
                    const filename = `cat-image.${extension}`;
                    const filepath = path.join(__dirname, filename);
                    
                    // Download the image
                    https.get(imageUrl, (imageResponse) => {
                        const fileStream = fs.createWriteStream(filepath);
                        imageResponse.pipe(fileStream);
                        
                        fileStream.on('finish', () => {
                            fileStream.close();
                            console.log(`✅ Cat image generated successfully!`);
                            console.log(`📁 Saved as: ${filepath}`);
                            resolve(filepath);
                        });
                    }).on('error', (err) => {
                        fs.unlink(filepath, () => {}); // Delete the file on error
                        reject(err);
                    });
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Run the function
generateCatImage()
    .then((filepath) => {
        console.log(`\n🐱 Cat image is ready at: ${filepath}`);
    })
    .catch((error) => {
        console.error('❌ Error generating cat image:', error.message);
        process.exit(1);
    });
