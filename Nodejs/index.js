const cloudinary = require('cloudinary').v2;
const https = require('https');
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
// const { ObjectID } = require('mongodb');
const { generateVoice  } = require('../videoshow/helper');
const { createVideoWithGeneratedFiles } = require('../videoshow/examples/transition');
const concatenateVideos = require('../videoshow/examples/concat');
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
require("dotenv").config();
const { client, db } = require('./mongoConnection')
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const { updateChannel } = require('./config.js');
const { main } = require('./main.js')
const { channel } = require('./config.js');
const {helper} = require('./helper.js');
cloudinary.config({ 
  cloud_name: 'dj3qabx11', 
  api_key: '533762782692462', 
  api_secret: 'YcvSAvEFsEu-rZyhKmLnI3bQ5KQ'
});



const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ['https://5173-baitech365-aividedit-1tshd2b1yqy.ws-us110.gitpod.io'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  headers: ['Content-Type', 'Authorization']
}));
cloudinary.config({
  secure: true
});

async function ensureChatGPTAPI() {
  if (!helper.getChatGPTAPI()) {
      await helper.setupChatGPTAPI();
  }
  return helper.getChatGPTAPI();
}


const PORT = process.env.PORT || 3000;
const userCollection = db.collection('user');
const seriesCollection = db.collection('series');

   

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




// Saving and getting user login, plan data
app.post("/user", async (req, res) => {
  const { email, tokenInfo } = req.body;

  const existingUser = await userCollection.findOne({ email });

  if (!existingUser) {
    const newUser = {
      email,
      tokenInfo,
      plan: 'free',
      expiryDate: null
    };

    const result = await userCollection.insertOne(newUser);
    if(result.insertedId){
      res.json(newUser);
    }else{
      res.json({message:'Could Not saved. Try again.'})
    }
    
  } else {
    res.json(existingUser);
  }
});


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

// Saving series data
app.post("/series", async (req,res) => {
  const {destination, content, narrator, language, duration, userEmail} = req.body;

  console.log('data received from the frontend', req.body)
  try {
    const result = await seriesCollection.insertOne({
      destination,
      content,
      narrator,
      language,
      duration,
      userEmail
    });
    console.log('Data saved successfully:', result);
    res.status(201).send('Data saved successfully');
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).send('Error saving data');
  }

})

// Getting series info
app.get('/series_info', async (req, res) => {
  const email = req.query.email;

  try {
    const seriesData = await seriesCollection.find({ userEmail: email }).toArray();
    res.json(seriesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching series data' });
  }
});

app.post('/generate_video', async(req, res) =>{
  const {email,seriesId} = req.body;
  const seriesData = await seriesCollection.findOne({ _id: new ObjectId(seriesId) });

  if (seriesData) {
    // console.log('Series data found:', seriesData);
    const topic = seriesData.content;
    console.log('topic:', topic);
    
     // Copy the channel object and modify it
     const modifiedChannel = {
      ...channel,  // Spread the existing channel object
      Motivation: {
        ...channel.Motivation,  
        GetStoriesList: channel.Motivation.GetStoriesList.replace('{topicName}', topic).replace('{topicCount}', '5')
      }
    };
    const chatGPTAPI = await ensureChatGPTAPI();
    if (chatGPTAPI) {
      await main(modifiedChannel, seriesId);
  // await cronJob(); // Wait for the cron job to finish
  const generatedVideo = await test(seriesId)
  console.log('final output', generatedVideo)
  } else {
      console.error("Failed to initialize ChatGPTAPI");
  }
     
  } else {
    console.log('Series data not found');
  }
})

const imagesDir = path.join(__dirname, '..', 'videoshow', 'examples');
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



async function getAllMidjourneyData(seriesId) {
  try {
      const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
      const client = new MongoClient(uri);
      await client.connect();

      const db = client.db();
      const collection = db.collection('MidjourneyImages');
      const documents = await collection.find({ seriesId: seriesId }).project({ _id: 0, upscaleImage_url: 1, quote: 1, topic :1 }).limit(5).toArray();
      
      
      console.log('midjourney data doc', documents)

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
// console.log('Downloaded images:', imageFileNames);

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

// Function to upload a video file to Cloudinary
async function uploadVideoToCloudinary(videoFilePath) {
  try {
    // Upload the video file to Cloudinary
    const result = await cloudinary.uploader.upload(videoFilePath, {
      resource_type: "video"
    });

    // Log the result (optional)
    // console.log('Upload result:', result);

    return result.secure_url; // Return the secure URL of the uploaded video
  } catch (error) {
    console.error('Error uploading video to Cloudinary:', error);
    throw error; // Throw the error for handling by the caller
  }
}
  
// Function to upload video link to mongodb

async function uploadVideoLinkToMongoDB(videoLink) {
  try {
    const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db();
    const collection = db.collection('FinalVideo');
   // Insert document with videoLink and default status
   const result = await collection.insertOne({
    videoLink: videoLink,
    status: "review" // Default status
  });
  console.log(`Video link uploaded to MongoDB with ID: ${result.insertedId}`);
  } catch(error) {
    console.log(`Error uploading video link to MongoDB: ${error}`);
  } 

}

  // Usage example
  async function test(seriesId) {
  // const generatedFiles = [
  //   {
  //     audio: 'output_2024-04-30T04-54-22.183Z.mp3',
  //     captions: 'output_2024-04-30T04-54-22.183Z.srt',
  //     image: 'image_1.jpg',
  //     duration: 2.533875
  //   },
  //   {
  //     audio: 'output_2024-04-30T04-54-25.574Z.mp3',
  //     captions: 'output_2024-04-30T04-54-25.574Z.srt',
  //     image: 'image_2.jpg',
  //     duration: 10.762438
  //   },
  //   {
  //     audio: 'output_2024-04-30T04-54-34.664Z.mp3',
  //     captions: 'output_2024-04-30T04-54-34.664Z.srt',
  //     image: 'image_3.jpg',
  //     duration: 12.852188
  //   },
  //   {
  //     audio: 'output_2024-04-30T04-54-45.091Z.mp3',
  //     captions: 'output_2024-04-30T04-54-45.091Z.srt',
  //     image: 'image_4.jpg',
  //     duration: 4.623625
  //   },
  //   {
  //     audio: 'output_2024-04-30T04-54-49.328Z.mp3',
  //     captions: 'output_2024-04-30T04-54-49.328Z.srt',
  //     image: 'image_5.jpg',
  //     duration: 12.773875
  //   }
  // ]
  const videoFilePath = path.join(__dirname, 'concatFile.mp4');
  let cloudinaryLink;
    try {
      
    const generatedFiles = await getAllMidjourneyData(seriesId);

      // creating video for each quote along with subtitle
     await createVideoWithGeneratedFiles(generatedFiles);
     console.log('All videos created and merged successfully.');
    
      // console.log('Midjourney data:', generatedFiles);

      // concatenate all the videos to make a single video

      await concatenateVideos();
      
      // console.log('Concatenation done for video')
      // console.log(videoFilePath)

      // uploading the video in cloudinary

  await uploadVideoToCloudinary(videoFilePath)
  .then(uploadedVideoUrl => {
    cloudinaryLink = uploadedVideoUrl
    console.log('Video uploaded to Cloudinary:', uploadedVideoUrl);
  })
  .catch(error => {
    console.error('Error uploading video:', error);
  });

  console.log('cludl link', cloudinaryLink)

      // Saving uploaded video link to the database.
  await uploadVideoLinkToMongoDB(cloudinaryLink)
  console.log('video file link upload complete.')

    } catch (error) {
      console.error('Error:', error);
    }
  }
  
//   async function fetchAllDataFromMidjourneyImages() {
//     const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
//       const client = new MongoClient(uri);

//     try {
//         // Connect to the MongoDB cluster
//         await client.connect();
//         const db = client.db();
//         const collection = db.collection('MidjourneyImages');

//         // Fetch all documents from the collection
//         // const documents = await collection.find({seriesId:'6634cf9ad1792b03f41b0038' }).toArray();
//         const seriesId = '6634cf9ad1792b03f41b0038'; 
//         // Count the documents that match the seriesId
//         const count = await collection.countDocuments({ seriesId: seriesId });
        
//         // Log the count
//         console.log(`There are ${count} documents in the MidjourneyImages collection with seriesId '${seriesId}'.`);
    
//         // Log the documents
//         // console.log(documents);
//     } catch (error) {
//         // Handle potential errors
//         console.error("Failed to fetch data:", error);
//     } finally {
//         // Ensure that the client will close when you finish/error
//         await client.close();
//     }
// }

// fetchAllDataFromMidjourneyImages();


  // test();
  app.listen(PORT, () => {
    console.log(`lOCAL HOST RUNNING ON: HTTP://LOCALHOST:${PORT}`);
  
    
  });