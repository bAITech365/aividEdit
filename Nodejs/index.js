
const https = require('https');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { generateVoice  } = require('../videoshow/helper');


const imagesDir = path.join(__dirname, '..', 'videoshow', 'examples');

// Ensure the directory exists
if (!fs.existsSync(imagesDir)){
    fs.mkdirSync(imagesDir, { recursive: true });
}


async function getAllMidjourneyData() {
  try {
      const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
      const client = new MongoClient(uri);
      await client.connect();

      const db = client.db();
      const collection = db.collection('MidjourneyImages');
      const topic = 'Motivation';
      const documents = await collection.find({ topic: topic }).project({ _id: 0, image_url: 1, quote: 1 }).limit(5).toArray();

const images = [];
const quotes = [];

documents.forEach(doc => {
    images.push(doc.image_url);
    quotes.push(doc.quote);
});

      client.close();
      const imageFileNames = [];

// Function to download an image
async function downloadImage(url, index) {
  const imageFilename = `image_${index + 1}.jpg`;
  const imagePath = path.join(imagesDir, imageFilename);
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(imagePath, Buffer.from(buffer));
  // console.log(`Downloaded image ${imageFilename}`);
  imageFileNames.push(imageFilename);
}

// Loop through the images array and download each image
for (let i = 0; i < images.length; i++) {
  await downloadImage(images[i], i);
}
console.log('Downloaded images:', imageFileNames);

        const generatedFiles = [];

        for (let i = 0; i < quotes.length; i++) {
            const quote = quotes[i];
            const { audio, captions } = await generateVoice(quote);
            if (audio && captions) {
                generatedFiles.push({ audio, captions, image: imageFileNames[i] });
                console.log(`Voice generated for quote: ${quote}`);
            } else {
                console.log(`Error generating voice for quote: ${quote}`);
            }
        }

        console.log('Generated files:', generatedFiles);
  } catch (error) {
      console.error('Error generating voice:', error);
  }
}


  
  // Usage example
  async function test() {
    try {
      const midjourneyData = await getAllMidjourneyData();
      console.log('Midjourney data:', midjourneyData);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  test();
