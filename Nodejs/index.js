
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
// const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');

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


// Function to calculate audio duration
async function getAudioDuration(filePath) {
  return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
          if (err) {
              reject(err);
          } else {
              const duration = metadata.format.duration;
              resolve(duration);
          }
      });
  });
}

async function getAllMidjourneyData() {
  try {
      const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
      const client = new MongoClient(uri);
      await client.connect();

      const db = client.db();
      const collection = db.collection('MidjourneyImages');
      const topic = 'Motivation';
      const documents = await collection.find({ topic: topic }).project({ _id: 0, upscaleImage_url: 1, quote: 1 }).limit(5).toArray();
      
      // console.log(documents)

const images = [];
const quotes = [];

documents.forEach(doc => {
    images.push(doc.upscaleImage_url);
    quotes.push(doc.quote);
});

      // client.close();
      const imageFileNames = [];

// // Function to download an image
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
              const audioDir = path.join(__dirname, '..', 'videoshow', 'examples');
        const audioPath = path.join(audioDir, audio);

        // Calculate audio duration for each audio file
        const audioDuration = await getAudioDuration(audioPath);

        // Add the audio duration to the generatedFiles array
        generatedFiles.push({ audio, captions, image: imageFileNames[i], duration: audioDuration });

        console.log(`Voice generated for quote: ${quote}`);
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
  const generatedFiles = [
    {
      audio: 'output_2024-04-30T04-54-22.183Z.mp3',
      captions: 'output_2024-04-30T04-54-22.183Z.srt',
      image: 'image_1.jpg',
      duration: 2.533875
    },
    {
      audio: 'output_2024-04-30T04-54-25.574Z.mp3',
      captions: 'output_2024-04-30T04-54-25.574Z.srt',
      image: 'image_2.jpg',
      duration: 10.762438
    },
    {
      audio: 'output_2024-04-30T04-54-34.664Z.mp3',
      captions: 'output_2024-04-30T04-54-34.664Z.srt',
      image: 'image_3.jpg',
      duration: 12.852188
    },
    {
      audio: 'output_2024-04-30T04-54-45.091Z.mp3',
      captions: 'output_2024-04-30T04-54-45.091Z.srt',
      image: 'image_4.jpg',
      duration: 4.623625
    },
    {
      audio: 'output_2024-04-30T04-54-49.328Z.mp3',
      captions: 'output_2024-04-30T04-54-49.328Z.srt',
      image: 'image_5.jpg',
      duration: 12.773875
    }
  ]
    try {
      // const generatedFiles = await getAllMidjourneyData();
     await createVideoWithGeneratedFiles(generatedFiles);
     console.log('All videos created and merged successfully.');
      // console.log('Midjourney data:', generatedFiles);
      // concatenateVideos();
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  test();
  app.listen(PORT, () => {
    console.log(`lOCAL HOST RUNNING ON: HTTP://LOCALHOST:${PORT}`);
  
    
  });