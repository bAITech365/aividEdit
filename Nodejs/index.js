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
const crypto = require('crypto');
const session = require('express-session');
const jwt = require('jsonwebtoken');




cloudinary.config({ 
  cloud_name: 'dj3qabx11', 
  api_key: '533762782692462', 
  api_secret: 'YcvSAvEFsEu-rZyhKmLnI3bQ5KQ'
});



const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ['https://5173-baitech365-aividedit-q7iuauhiu1c.ws-us110.gitpod.io'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  headers: ['Content-Type', 'Authorization']
}));
cloudinary.config({
  secure: true
});
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}));

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
const REDIRECT_URI = `https://3000-baitech365-aividedit-q7iuauhiu1c.ws-us110.gitpod.io/oauth2callback`;
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
// let userToken;

// const SCOPES = ["https://www.googleapis.com/auth/youtube.upload" ,
// 'openid',
// 'email'];

app.get("/connect_youtube", (req, res) => {
  const state = crypto.randomBytes(20).toString('hex');
  const nonce = crypto.randomBytes(20).toString('hex'); 


  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.upload" ,
    'openid',
    'email'],
    include_granted_scopes: true,
    state: state,
    nonce: nonce,
    response_type: 'code', 
    prompt: 'consent',
  });
  // userToken = ''
  console.log('redirect url', authUrl)
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  console.log('code callback', code)
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    console.log('tokens', tokens)
    oAuth2Client.setCredentials(tokens);

     // Decode the id_token
     const decoded = jwt.decode(tokens.id_token);
     console.log('decoded', decoded)

     const user = await userCollection.findOne({ email: decoded.email });
     console.log('inside oauth user data', user)
    // Store the tokens and user ID in the database
    if (user) {
      const updateResult = await userCollection.updateOne(
        { email: decoded.email },
        { $set: { accessToken: tokens.access_token, refreshToken: tokens.refresh_token, googleId: decoded.sub} }
      );
      console.log('Updated document:', updateResult);
    } else {
      // No user found, create a new user
      const newUser = {
        googleId: decoded.sub,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        email: decoded.email
      };
      const insertResult = await userCollection.insertOne(newUser);
      console.log('Inserted document:', insertResult);
    }

    res.redirect(`https://5173-baitech365-aividedit-q7iuauhiu1c.ws-us110.gitpod.io/dashboard?googleId=${decoded.sub}`); // Redirect back to the frontend
  } catch (error) {
    console.error('Error retrieving access token', error);
    res.status(500).send('Authentication failed');
  }
});




// Saving and getting user login, plan data
app.post("/user", async (req, res) => {
  const { email } = req.body;
 
  console.log(email)
  const existingUser = await userCollection.findOne({ email });
console.log(existingUser)
  if (!existingUser) {
    const newUser = {
      email,
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

async function deleteUserById(id) {
  try {
    // Assuming userCollection is your MongoDB collection
    const result = await userCollection.deleteOne({ _id: id });
    if (result.deletedCount === 1) {
      console.log('Document deleted successfully');
    } else {
      console.log('Document not found');
    }
  } catch (error) {
    console.error('Error deleting document:', error);
  }
} 

// Usage
// deleteUserById(new ObjectId('6638b185b195df46e450ee01'));

// async function userEmail() {
//   const email = 'enayetflweb.com'
//   const user = await userCollection.find().toArray();
    
//   if (user && user.length > 0) {
//     console.log('Users found:', user);
//   } else {
//     console.log('No user found with that email');
//   }
// }
// userEmail()

app.post("/upload_video",  async (req, res) => {
  const { email } = req.body;
  
  const user = await userCollection.findOne({ email });
  if (!user) {
    return res.status(404).send('User not found');
  }
console.log('user in upload video', user)
  oAuth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });
 
  const youtube = google.youtube({
    version: 'v3',
    auth: oAuth2Client,
  });



  // Helper function to upload a video
  async function uploadVideo(filePath, title, description, delay) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await youtube.videos.insert({
            part: 'snippet,status',
            requestBody: {
              snippet: {
                title: title,
                description: description,
              },
              status: {
                privacyStatus: 'private',
              },
            },
            media: {
              body: fs.createReadStream(filePath),
            },
          });
          console.log(`Video uploaded with ID: ${response.data.id} on ${new Date().toLocaleString()}`);
          resolve(response.data.id); // Resolve the promise with the video ID
        } catch (error) {
          console.error('Failed to upload video:', error);
          reject(error); // Reject the promise on error
        }
      }, delay);
    });
  }
  
  try {
    // Upload videos sequentially with a two-minute interval between each
    await uploadVideo('./final_1.mp4', 'Test Video 1', 'This is the first test video.', 0);
    await uploadVideo('./final_2.mp4', 'Test Video 2', 'This is the second test video.', 20000);
    await uploadVideo('./final_3.mp4', 'Test Video 3', 'This is the third test video.', 40000);
    await uploadVideo('./final_4.mp4', 'Test Video 4', 'This is the fourth test video.', 60000);
    await uploadVideo('./final_5.mp4', 'Test Video 5', 'This is the fifth test video.', 80000);
    
    res.send('All videos have been scheduled for upload.');
  } catch (error) {
    res.status(500).send('Failed to upload one or more videos.');
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

// Define the PATCH route
app.patch("/googleId", async (req, res) => {
  console.log('PATCH ROUTE HIT')
  const taskId = req.query.taskId;  // Accessing taskId from query parameters
  const { googleId } = req.body;  // Destructuring to extract googleId from request body
  console.log('PATCH ROUTE HIT', googleId, taskId)

  try {
      // Update document in MongoDB
    const result = await seriesCollection.updateOne(
        { _id: new ObjectId(taskId) }, 
        { $set: { googleId: googleId } }
    );

    if (result.matchedCount === 0) {
        return res.status(404).send({
            message: "No task found with that ID",
            status: "fail"
        });
    }

    console.log(`Updated task ${taskId} with new Google ID: ${googleId}`);
    res.send({
        message: `Task ${taskId} has been updated with new Google ID: ${googleId}`,
        status: "success"
    });
} catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    res.status(500).send({
        message: `Error updating task with ID ${taskId}`,
        status: "error"
    });
}
});
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
  console.log('email and series id', email, seriesId)
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
        GetStoriesList: channel.Motivation.GetStoriesList.replace('{topicName}', topic).replace('{topicCount}', '1')
      }
    };
    const topicId = 'bc51336c-2602-48c8-8c5b-57cb4b889718'
    const chatGPTAPI = await ensureChatGPTAPI();
    if (chatGPTAPI) {
      // const topicId = await main(modifiedChannel, seriesId);
      // console.log('topic id inside the generate video function', topicId)
  // const generatedVideo = await test(topicId)
      // console.log('generate video cloul link', generatedVideo)
  // YOUTUBE FUNCTIONALITY
  const tokens = await userCollection.findOne({googleId : seriesData.googleId})
  if (!tokens) {
    console.error("No tokens found for the given Google ID.");
    return;
  }
      oAuth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });
     console.log('oauth', oAuth2Client)
      const youtube = google.youtube({
        version: 'v3',
        auth: oAuth2Client,
      });
  const output = path.join(__dirname, 'concatFile.mp4');
  const MidjourneyImagesCollection = db.collection('MidjourneyImages');
  const title = await MidjourneyImagesCollection.findOne({ topicId }, { projection: { topic: 1, _id: 0 } })
  console.log('tittle', title.topic)
  try {
    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title.topic,
          // description: description,
        },
        status: {
          privacyStatus: 'private',
        },
      },
      media: {
        body: fs.createReadStream(output),
      },
    });
    console.log('youtube res', response)
    console.log(`Video uploaded with ID: ${response.data.id} on ${new Date().toLocaleString()}`);
  
  } catch (error) {
    console.error('Failed to upload video:', error);
  }
  
  // console.log('final output', generatedVideo)
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



async function getAllMidjourneyData(topicId) {
  try {
      const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
      const client = new MongoClient(uri);
      await client.connect();

      const db = client.db();
      const collection = db.collection('MidjourneyImages');
      const documents = await collection.find({ topicId: topicId }).project({ _id: 0, upscaleImage_url: 1, quote: 1, topic :1 }).limit(5).toArray();
      
      
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

async function uploadVideoLinkToMongoDB(videoLink, topicId) {
  const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('FinalVideo');
   // Insert document with videoLink and default status
   const result = await collection.insertOne({
    videoLink: videoLink,
    status: "review",
    topicId: topicId
  });
  console.log(`Video link uploaded to MongoDB with ID: ${result.insertedId}`);
  if (result.insertedId) {
    const imageCollection = db.collection('MidjourneyImages');
    // Update all matching documents in the MidjourneyImages collection
    const updateResult = await imageCollection.updateMany(
        { topicId: topicId }, // Filter documents by topicId
        { $set: { videoStatus: "created" } } // Set new property videoStatus to "created"
    );

    console.log(`Updated ${updateResult.matchedCount} documents with videoStatus set to 'created'`);
}

  } catch(error) {
    console.log(`Error uploading video link to MongoDB: ${error}`);
  } finally {
    await client.close(); // Ensure that the client is closed after the operation
}

}

  // Usage example
  async function test(topicId) {
  
  const videoFilePath = path.join(__dirname, 'concatFile.mp4');
  let cloudinaryLink;
    try {
      
    const generatedFiles = await getAllMidjourneyData(topicId);

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
  await uploadVideoLinkToMongoDB(cloudinaryLink, topicId)
  console.log('video file link upload complete.')
return cloudinaryLink

    } catch (error) {
      console.error('Error:', error);
    }
  }
  

  // test();
  app.listen(PORT, () => {
    console.log(`lOCAL HOST RUNNING ON: HTTP://LOCALHOST:${PORT}`);
  
    
  });