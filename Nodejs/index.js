// const { generateVoice  } = require('../videoshow/helper');

// const fakeData = [
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   },
//   {
//       topic: 'Motivation',
//       quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
//   },
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   },
//   {
//       topic: 'Motivation',
//       quote: 'The only limit to our realization of tomorrow will be our doubts of today.'
//   },
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   }
// ];




// async function main() {
//     try {
//         const topic = 'Motivation'; // Fake topic for testing
//         const quotes = fakeData.map(item => item.quote);

//         // Fake images for testing
//         const images = [
//             'https://media.istockphoto.com/id/1264156957/photo/young-man-in-the-city-reaching-his-goals.jpg?s=612x612&w=0&k=20&c=-xtXMjc8CecrJWLkETw6yk6-yVhswh7w1_uh5ele820=',
//             'https://images.ctfassets.net/txbhe1wabmyx/1rYV5ca3R7Foi02XHBQGOy/61fa9a0d320fdea407d61eec2f9bd27e/josh-gordon-fzHmP6z8OQ4-unsplash.jpg',
//             'https://www.univariety.com/blog/wp-content/uploads/2014/08/motivational-goals-1200x1200.jpg',
//             'https://papertyari.com/wp-content/uploads/2019/02/motivation-1024x568.jpg',
//             'https://www.emotionalintelligencecourse.com/wp-content/uploads/2022/06/Motivation.jpg'
//         ];

//         // Generate audio from the fake quotes
//         for (const data of fakeData) {
//           const audioFile = await generateVoice(data.quote);
//           console.log('Audio file generated:', audioFile);
//       }
//         // await createSlideshow(images, audioFile);
//     } catch (error) {
//         console.error('Error in main function:', error);
//     }
// }

// async function createSlideshow(images, audioFile) {
//     // Your code to create the slideshow using videoshow
// }

// // Invoke the main function
// main();




// const express = require('express');
// const axios = require('axios');
// const app = express();
// const port = 3000;
// const https = require('https');
// app.use(express.json());
// const path = require('path');
// const fs = require('fs');

// const { MongoClient } = require('mongodb');
// const fakeData = [
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   },
//   {
//       topic: 'Motivation',
//       quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
//   },
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   },
//   {
//       topic: 'Motivation',
//       quote: 'The only limit to our realization of tomorrow will be our doubts of today.'
//   },
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   }
// ];
const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";



// const images = ['https://media.istockphoto.com/id/1264156957/photo/young-man-in-the-city-reaching-his-goals.jpg?s=612x612&w=0&k=20&c=-xtXMjc8CecrJWLkETw6yk6-yVhswh7w1_uh5ele820=', 'https://images.ctfassets.net/txbhe1wabmyx/1rYV5ca3R7Foi02XHBQGOy/61fa9a0d320fdea407d61eec2f9bd27e/josh-gordon-fzHmP6z8OQ4-unsplash.jpg', 'https://www.univariety.com/blog/wp-content/uploads/2014/08/motivational-goals-1200x1200.jpg', 'https://papertyari.com/wp-content/uploads/2019/02/motivation-1024x568.jpg', 'https://www.emotionalintelligencecourse.com/wp-content/uploads/2022/06/Motivation.jpg']

const https = require('https');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { generateVoice  } = require('../videoshow/helper');
// Define the directory where images will be saved
// Navigating up from the current directory (Nodejs) and into the videoshow/examples folder
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

// console.log('Images:', images);
// console.log('Quotes:', quotes);
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
// console.log(imageFileNames)
const generatedFiles = [];
// Function to generate voice for each quote
async function generateVoiceForQuotes() {
  try {
      for (const quote of quotes) {
          const { audio, captions } = await generateVoice(quote);
          if (audio && captions) {
              generatedFiles.push({ audio, captions });
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
// Call the function to generate voice for each quote
generateVoiceForQuotes();

      // let fileNames = {
      //     images: [],
      //     audio: []
      // };

      // const generateVoicePromises = documents.map(async (doc, index) => {
      //     const url = doc.image_url;
      //     const quote = doc.quote;
      //     const imageFilename = `image_${index + 1}.jpg`;
      //     const imagePath = path.join(imagesDir, imageFilename);

      //     fileNames.images.push(imageFilename);

      //     const imageDownloadPromise = new Promise((resolve, reject) => {
      //         const file = fs.createWriteStream(imagePath);
      //         https.get(url, (response) => {
      //             response.pipe(file);
      //             file.on('finish', () => {
      //                 file.close();
      //                 resolve(`Downloaded image to ${imagePath}`);
      //             });
      //         }).on('error', (err) => {
      //             fs.unlink(imagePath, () => reject(`Error downloading image from ${url}: ${err.message}`)); // Delete the file asynchronously on error
      //         });
      //     });

      //     const generateVoicePromise = generateVoice(quote);

      //     await Promise.all([imageDownloadPromise, generateVoicePromise]); // Wait for both download and voice generation

      //     return `Generated voice for quote: ${quote}`;
      // });

      // await Promise.all(generateVoicePromises);
      // console.log(fileNames);
      // console.log('All images and voices have been processed.');
      // return fileNames;
  } catch (error) {
      console.error('Error:', error);
      throw error;
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
