
const https = require('https');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { generateVoice  } = require('../videoshow/helper');
const { createVideoWithGeneratedFiles } = require('../videoshow/examples/transition');
const concatenateVideos = require('../videoshow/examples/concat');
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
require("dotenv").config();

const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5000;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `https://5000-baitech365-aividedit-do4t743qzwi.ws-us110.gitpod.io/oauth2callback`;
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
let userToken;

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];

app.get("/connect_youtube", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  userToken = ''
  console.log('redirect url', authUrl)
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  console.log('token',tokens)
  oAuth2Client.setCredentials(tokens);
  userToken = tokens
  res.redirect('http://localhost:5173')
});


const imagesDir = path.join(__dirname, '..', 'videoshow', 'examples');

app.post("/upload_video",  async (req, res) => {
  const title = 'test 1'
  const description = 'desc 1'
  const videoFilePath = path.join(__dirname, 'video10.mp4')
  try {
    const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
    const response = await youtube.videos.insert({
      part: "snippet,contentDetails,status",
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: ["Node.js", "API Upload"],
        },
        status: {
          privacyStatus: "public",
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    });

    fs.unlinkSync(videoFilePath);
    console.log('youtube response', response)
    res.status(200).send("Video uploaded successfully!");
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).send("Failed to upload video");
  }
})

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
                // console.log(`Voice generated for quote: ${quote}`);
            } else {
                console.log(`Error generating voice for quote: ${quote}`);
            }
        }
console.log('Generated file from database', generatedFiles)
        return generatedFiles;
  } catch (error) {
      console.error('Error generating voice:', error);
  }
}


  
  // Usage example
  async function test() {
  //  const generatedFiles = [
  //     {
  //       audio: '/output_2024-04-29T07-15-49.035Z.mp3',
  //       captions: '/output_2024-04-29T07-15-49.035Z.srt',
  //       image: '/image_1.jpg'
  //     },
  //     {
  //       audio: '/output_2024-04-29T07-15-52.227Z.mp3',
  //       captions: '/output_2024-04-29T07-15-52.227Z.srt',
  //       image: '/image_2.jpg'
  //     },
  //     {
  //       audio: '/output_2024-04-29T07-16-00.643Z.mp3',
  //       captions: '/output_2024-04-29T07-16-00.643Z.srt',
  //       image: '/image_3.jpg'
  //     },
  //     {
  //       audio: '/output_2024-04-29T07-16-12.524Z.mp3',
  //       captions: '/output_2024-04-29T07-16-12.524Z.srt',
  //       image: '/image_4.jpg'
  //     },
  //     {
  //       audio: '/output_2024-04-29T07-16-19.631Z.mp3',
  //       captions: '/output_2024-04-29T07-16-19.631Z.srt',
  //       image: '/image_5.jpg'
  //     }
  //   ]
    try {
      const generatedFiles = await getAllMidjourneyData();
     await createVideoWithGeneratedFiles(generatedFiles);
     console.log('All videos created and merged successfully.');
      // console.log('Midjourney data:', generatedFiles);
      concatenateVideos();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  test();
  app.listen(PORT, () => {
    console.log(`lOCAL HOST RUNNING ON: HTTP://LOCALHOST:${PORT}`);
  
    
  });