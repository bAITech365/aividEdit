const cloudinary = require("cloudinary").v2;
const https = require("https");
const fs = require("fs");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
// const { ObjectID } = require('mongodb');
const { generateVoice } = require("../videoshow/helper");
const {
  createVideoWithGeneratedFiles,
} = require("../videoshow/examples/transition");
const concatenateVideos = require("../videoshow/examples/concat");
const express = require("express");
const bodyParser = require("body-parser");
const { google } = require("googleapis");
require("dotenv").config();
const {  getCollections  } = require("./mongoConnection");
const ffmpeg = require("fluent-ffmpeg");
const cors = require("cors");
const { updateChannel } = require("./config.js");
const { main } = require("./main.js");
const { channel } = require("./config.js");
const { helper } = require("./helper.js");
const crypto = require("crypto");
const session = require("express-session");
const jwt = require("jsonwebtoken");

cloudinary.config({
  cloud_name: "dj3qabx11",
  api_key: "533762782692462",
  api_secret: "YcvSAvEFsEu-rZyhKmLnI3bQ5KQ",
});

const app = express();
app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    headers: ["Content-Type", "Authorization"],
  })
);
cloudinary.config({
  secure: true,
});
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

async function ensureChatGPTAPI() {
  if (!helper.getChatGPTAPI()) {
    await helper.setupChatGPTAPI();
  }
  return helper.getChatGPTAPI();
}

const PORT = process.env.PORT || 3000;
// const db = await connect();
// const userCollection = db.collection("user");
// const seriesCollection = db.collection("series");
// const scheduleCollection = db.collection("video_schedules");

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:3000/oauth2callback`;
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// funciton for getting refresh token
async function refreshAccessToken(refreshToken) {
  oAuth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  try {
    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse.token;
    return accessToken;
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw new Error("Failed to refresh access token");
  }
}

app.get("/connect_youtube", (req, res) => {
  const state = crypto.randomBytes(20).toString("hex");
  const nonce = crypto.randomBytes(20).toString("hex");

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.upload",
      "openid",
      "email",
    ],
    include_granted_scopes: true,
    state: state,
    nonce: nonce,
    response_type: "code",
    prompt: "consent",
  });
  // userToken = ''
  console.log("redirect url", authUrl);
  res.redirect(authUrl);
});

app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  // console.log('code callback', code)
  const { userCollection} = await getCollections()
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    // console.log('tokens', tokens)
    oAuth2Client.setCredentials(tokens);

    // Decode the id_token
    const decoded = jwt.decode(tokens.id_token);
    //  console.log('decoded', decoded)

    const user = await userCollection.findOne({ email: decoded.email });
    //  console.log('inside oauth user data', user)
    // Store the tokens and user ID in the database
    if (user) {
      const updateResult = await userCollection.updateOne(
        { email: decoded.email },
        {
          $set: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            googleId: decoded.sub,
          },
        }
      );
      // console.log('Updated document:', updateResult);
    } else {
      // No user found, create a new user
      const newUser = {
        googleId: decoded.sub,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        email: decoded.email,
      };
      const insertResult = await userCollection.insertOne(newUser);
      // console.log('Inserted document:', insertResult);
    }

    res.redirect(
      `http://localhost:5173/dashboard?googleId=${decoded.sub}`
    ); // Redirect back to the frontend
  } catch (error) {
    console.error("Error retrieving access token", error);
    res.status(500).send("Authentication failed");
  }
});

// Saving and getting user login, plan data
app.post("/user", async (req, res) => {
  const { userCollection } = await getCollections()
  const { email } = req.body;
  console.log(email);
  const existingUser = await userCollection.findOne({ email });
  console.log(existingUser);
  if (!existingUser) {
    const newUser = {
      email,
      plan: "free",
      expiryDate: null,
    };

    const result = await userCollection.insertOne(newUser);
    if (result.insertedId) {
      res.json(newUser);
    } else {
      res.json({ message: "Could Not saved. Try again." });
    }
  } else {
    res.json(existingUser);
  }
});

app.post("/upload_video", async (req, res) => {
  const { email } = req.body;
  const { userCollection } = await getCollections()
  const user = await userCollection.findOne({ email });
  if (!user) {
    return res.status(404).send("User not found");
  }
  console.log("user in upload video", user);
  oAuth2Client.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });

  const youtube = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });

  // Helper function to upload a video
  async function uploadVideo(filePath, title, description, delay) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const response = await youtube.videos.insert({
            part: "snippet,status",
            requestBody: {
              snippet: {
                title: title,
                description: description,
              },
              status: {
                privacyStatus: "private",
              },
            },
            media: {
              body: fs.createReadStream(filePath),
            },
          });
          console.log(
            `Video uploaded with ID: ${
              response.data.id
            } on ${new Date().toLocaleString()}`
          );
          resolve(response.data.id); // Resolve the promise with the video ID
        } catch (error) {
          console.error("Failed to upload video:", error);
          reject(error); // Reject the promise on error
        }
      }, delay);
    });
  }

  try {
    // Upload videos sequentially with a two-minute interval between each
    await uploadVideo(
      "./final_1.mp4",
      "Test Video 1",
      "This is the first test video.",
      0
    );
    await uploadVideo(
      "./final_2.mp4",
      "Test Video 2",
      "This is the second test video.",
      20000
    );
    await uploadVideo(
      "./final_3.mp4",
      "Test Video 3",
      "This is the third test video.",
      40000
    );
    await uploadVideo(
      "./final_4.mp4",
      "Test Video 4",
      "This is the fourth test video.",
      60000
    );
    await uploadVideo(
      "./final_5.mp4",
      "Test Video 5",
      "This is the fifth test video.",
      80000
    );

    res.send("All videos have been scheduled for upload.");
  } catch (error) {
    res.status(500).send("Failed to upload one or more videos.");
  }
});

// Saving series data
app.post("/series", async (req, res) => {
  const { destination, content, narrator, language, duration, userEmail } =
    req.body;
    const { seriesCollection} = await getCollections()
  console.log("data received from the frontend", req.body);
  try {
    const result = await seriesCollection.insertOne({
      destination,
      content,
      narrator,
      language,
      duration,
      userEmail,
    });
    console.log("Data saved successfully:", result);
    res.status(201).send("Data saved successfully");
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).send("Error saving data");
  }
});

// Define the PATCH route
app.patch("/googleId", async (req, res) => {
  const taskId = req.query.taskId;
  const { googleId } = req.body;
  const { seriesCollection } = await getCollections()
  try {
    // Update document in MongoDB
    const result = await seriesCollection.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { googleId: googleId } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        message: "No task found with that ID",
        status: "fail",
      });
    }

    console.log(`Updated task ${taskId} with new Google ID: ${googleId}`);
    res.send({
      message: `Task ${taskId} has been updated with new Google ID: ${googleId}`,
      status: "success",
    });
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    res.status(500).send({
      message: `Error updating task with ID ${taskId}`,
      status: "error",
    });
  }
});
// Getting series info
app.get("/series_info", async (req, res) => {
  const email = req.query.email;
  const { seriesCollection } = await getCollections()
  try {
    const seriesData = await seriesCollection
      .find({ userEmail: email })
      .toArray();
    res.json(seriesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching series data" });
  }
});

app.post("/generate_video", async (req, res) => {
  const { email, seriesId, postADay } = req.body;
  console.log("series id and post", postADay, seriesId);
  const { scheduleCollection, seriesCollection } = await getCollections()
  // try {
  //   // const scheduleCollection = database.collection("scheduleCollection");

  //   const intervalHours = postADay === 1 ? 10 : 5;
  //   const totalTasks = postADay * 2; // 30 days * posts per day
  //   const currentTime = new Date();

  //   for (let i = 0; i < totalTasks; i++) {
  //     const scheduleTime = new Date(
  //       currentTime.getTime() + i * intervalHours * 90000
  //     );
  //     const task = {
  //       seriesId,
  //       status: "pending",
  //       scheduleTime,
  //       lastRunTime: null,
  //       result: null,
  //     };

  //     await scheduleCollection.insertOne(task);
  //   }

  //   res.status(200).send(`Scheduled ${totalTasks} tasks successfully.`);
  // } catch (error) {
  //   console.error("Failed to schedule task:", error);
  //   res.status(500).send("Failed to schedule task.");
  // } finally {
  //   // await dbClient.close();
  // }

  console.log("email and series id",  seriesId);
  const seriesData = await seriesCollection.findOne({
    _id: new ObjectId(seriesId),
  });

  if (seriesData) {
    // console.log('Series data found:', seriesData);
    const topic = seriesData.content;
    console.log("topic:", topic);

    // Copy the channel object and modify it
    const modifiedChannel = {
      ...channel, // Spread the existing channel object
      Motivation: {
        ...channel.Motivation,
        GetStoriesList: channel.Motivation.GetStoriesList.replace(
          "{topicName}",
          topic
        ).replace("{topicCount}", "1"),
      },
    };
    // const topicId = "098ffce8-5802-42ac-91a6-9c6a06b302f3";
    const chatGPTAPI = await ensureChatGPTAPI();
    if (chatGPTAPI) {
      const topicId = await main(modifiedChannel, seriesId);
      console.log('topic id inside the generate video function', topicId)
      const generatedVideo = await test(topicId)
      console.log('generate video cloul link', generatedVideo)
  //     // YOUTUBE FUNCTIONALITY
  //     const tokens = await userCollection.findOne({
  //       googleId: seriesData.googleId,
  //     });
  //     if (!tokens) {
  //       console.error("No tokens found for the given Google ID.");
  //       return;
  //     }
  //     try {
  //       const newAccessToken = await refreshAccessToken(tokens.refreshToken);
  //       console.log("New Access Token:", newAccessToken);

  //       oAuth2Client.setCredentials({
  //         access_token: newAccessToken,
  //         refresh_token: tokens.refreshToken,
  //       });

  //     } catch (error) {
  //       console.error("Error refreshing access token:", error);
  //       res.status(500).send("Failed to refresh Google access token.");
  //     }

  //     console.log("oauth", oAuth2Client.credentials);
  //     const youtube = google.youtube({
  //       version: "v3",
  //       auth: oAuth2Client,
  //     });
  //     const output = path.join(__dirname, "concatFile.mp4");
  //     const MidjourneyImagesCollection = db.collection("MidjourneyImages");
  //     const title = await MidjourneyImagesCollection.findOne(
  //       { topicId },
  //       { projection: { topic: 1, _id: 0 } }
  //     );
  //     console.log("tittle", title.topic);
  //     try {
  //       const response = await youtube.videos.insert({
  //         part: "snippet,status",
  //         requestBody: {
  //           snippet: {
  //             title: title.topic,
  //             // description: description,
  //           },
  //           status: {
  //             privacyStatus: "private",
  //           },
  //         },
  //         media: {
  //           body: fs.createReadStream(output),
  //         },
  //       });
  //       console.log("youtube res", response);
  //       console.log(
  //         `Video uploaded with ID: ${
  //           response.data.id
  //         } on ${new Date().toLocaleString()}`
  //       );
  //     } catch (error) {
  //       console.error("Failed to upload video:", error);
  //     }

  //     console.log('final output', generatedVideo)
    } else {
      console.error("Failed to initialize ChatGPTAPI");
    }
  } else {
    console.log("Series data not found");
  }
});

// HELPER FUNCTION FOR PROCESSING MAIN FUNCTION RETURN

async function processGPTTask(task) {
  const {  seriesCollection } = await getCollections()
  try {
    const seriesData = await seriesCollection.findOne({
      _id: new ObjectId(task.seriesId),
    });
    if (!seriesData) throw new Error("Series data not found");

    const topic = seriesData.content;
    const modifiedChannel = {
      ...channel, // Spread the existing channel object
      Motivation: {
        ...channel.Motivation,
        GetStoriesList: channel.Motivation.GetStoriesList.replace(
          "{topicName}",
          topic
        ).replace("{topicCount}", "1"),
      },
    };

    const chatGPTAPI = await ensureChatGPTAPI(); // Ensure this function is defined and imported
    if (!chatGPTAPI) {
      throw new Error("Failed to initialize ChatGPT API");
    }

    const topicId = await main(modifiedChannel, task.seriesId);
    if (!topicId) {
      throw new Error("Failed to process topic via GPT");
    }

    console.log("Topic ID inside the generate video function:", topicId);
    return { topicId, seriesData };
  } catch (error) {
    console.error(
      `Failed processing GPT task for series ID ${task.seriesId}: ${error}`
    );
    throw error; // Rethrow to handle it in the caller function
  }
}

// SETTING REFRESH TOKEN
async function updateAccessToken(tokens) {
  try {
    if (!tokens) throw new Error("No tokens found for the given Google ID.");
    const newAccessToken = await refreshAccessToken(tokens.refreshToken);
    console.log("New Access Token:", newAccessToken);

    oAuth2Client.setCredentials({
      access_token: newAccessToken,
      refresh_token: tokens.refreshToken,
    });

    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

// UPLOADING YOUTUBE VIDEO
async function uploadToYouTube(
  seriesData,
  topicId,
  accessToken,
  generatedVideo
) {
  // Separate function to handle YouTube uploading logic
  // console.log("New access token", accessToken);
  // console.log("oauth", oAuth2Client.credentials);
  const {  midjourneyImageCollection } = await getCollections()
  const youtube = google.youtube({
    version: "v3",
    auth: oAuth2Client,
  });
  const videoFileName = `${topicId}_finalVideo.mp4`;
  const output = path.join(__dirname, videoFileName);
  // const output = path.join(__dirname, "concatFile.mp4");
  const title = await midjourneyImageCollection.findOne(
    { topicId },
    { projection: { topic: 1, _id: 0 } }
  );
  console.log("title", title.topic);

  const response = await youtube.videos.insert({
    part: "snippet,status",
    requestBody: {
      snippet: {
        title: title.topic,
      },
      status: {
        privacyStatus: "private",
      },
    },
    media: {
      body: fs.createReadStream(output),
    },
  });
  // console.log("YouTube response", response);
  console.log(
    `Video uploaded with ID: ${
      response.data.id
    } on ${new Date().toLocaleString()}`
  );
}

// Running scheduled task for

async function runScheduledTasks() {
  const { userCollection, scheduleCollection} = await getCollections()
  try {
    // Find tasks that are scheduled to run and are still pending
    const query = {
      status: { $in: ["failed", "pending"] },
      scheduleTime: { $lte: new Date() },
    };
    const update = {
      $set: { status: "in_progress", lastRunTime: new Date() },
    };

    const options = {
      returnNewDocument: true,
    };

    const pendingTasks = await scheduleCollection.find(query).toArray();
    console.log(`Processing started for ${pendingTasks.length} pending tasks at ${new Date().toISOString()}`);


    for (const task of pendingTasks) {
     try {
      console.log(`Processing started for task with ID ${task._id} at ${new Date().toISOString()}`);
      
      const updateResult = await scheduleCollection.updateOne(
        { _id: task._id, status: { $in: ["failed", "pending"] } },
        { $set: { status: "in_progress", lastRunTime: new Date() } }
      );

      if (updateResult.modifiedCount === 1){
        try {
          const { topicId, seriesData } = await processGPTTask(task);
          const generatedVideo = await test(topicId);
          console.log("generate video cloul link", generatedVideo);
          // YOUTUBE FUNCTIONALITY
          const tokens = await userCollection.findOne({
            googleId: seriesData.googleId,
          });
  
          const accessToken = await updateAccessToken(tokens);
          console.log("New access token", accessToken);
          console.log("oauth", oAuth2Client.credentials);
  
          await uploadToYouTube(seriesData, topicId, accessToken, generatedVideo);
  
          // Update task status to completed if all went well
          await scheduleCollection.updateOne(
            { _id: task._id },
            { $set: { status: "completed", result: "Success" } }
          );
        } catch (error) {
          // Handle any errors, e.g., update the task with a failed status
          await scheduleCollection.updateOne(
            { _id: task._id },
            {
              $set: { status: "failed", result: error.message },
            }
          );
        }
      } else {
        console.log("Task already processed or status updated by another instance");
      }
     } catch (error) {
      console.error(`Error processing task with ID ${task._id}: ${error}`);
    await scheduleCollection.updateOne(
      { _id: task._id },
      { $set: { status: "failed", result: error.message } }
    );
     }
    }
  } catch (error) {
    console.error("Error running scheduled tasks:", error);
  } finally {
    // await client.close();
  }
}

const imagesDir = path.join(__dirname, "..", "videoshow", "examples");
// Ensure the directory exists
if (!fs.existsSync(imagesDir)) {
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
    const { midjourneyImageCollection } = await getCollections()
    const documents = await midjourneyImageCollection
      .find({ topicId: topicId })
      .project({ _id: 0, upscaleImage_url: 1, quote: 1, topic: 1 })
      .limit(5)
      .toArray();

    console.log("midjourney data doc", documents);

    const images = [];
    const quotes = [];

    documents.forEach((doc) => {
      images.push(doc.upscaleImage_url);
      quotes.push(doc.quote);
    });

    // client.close();
    const imageFileNames = [];

    // // Function to download an image
    async function downloadImage(url, index, topicId) {
      const imageFilename = `image_${topicId}_${index + 1}.jpg`;
      console.log("download image file name", imageFilename);
      const imagePath = path.join(imagesDir, imageFilename);
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(imagePath, Buffer.from(buffer));
      // console.log(`Downloaded image ${imageFilename}`);
      imageFileNames.push(imageFilename);
    }

    // Loop through the images array and download each image
    for (let i = 0; i < images.length; i++) {
      await downloadImage(images[i], i, topicId);
    }
    // console.log('Downloaded images:', imageFileNames);

    const generatedFiles = [];

    for (let i = 0; i < quotes.length; i++) {
      const quote = quotes[i];
      const { audio, captions } = await generateVoice(quote, topicId, i);
      if (audio && captions) {
        const audioDir = path.join(__dirname, "..", "videoshow", "examples");
        const audioPath = path.join(audioDir, audio);

        // Calculate audio duration for each audio file
        const audioDuration = await getAudioDuration(audioPath);

        // Add the audio duration to the generatedFiles array
        generatedFiles.push({
          audio,
          captions,
          image: imageFileNames[i],
          duration: audioDuration,
        });

        console.log(`Voice generated for quote: ${quote}`);
      } else {
        console.log(`Error generating voice for quote: ${quote}`);
      }
    }
    console.log("Generated file from database", generatedFiles);
    return generatedFiles;
  } catch (error) {
    console.error("Error generating voice:", error);
  }
}

// Function to upload a video file to Cloudinary
async function uploadVideoToCloudinary(videoFilePath) {
  try {
    // Upload the video file to Cloudinary
    const result = await cloudinary.uploader.upload(videoFilePath, {
      resource_type: "video",
    });

    // Log the result (optional)
    // console.log('Upload result:', result);

    return result.secure_url; // Return the secure URL of the uploaded video
  } catch (error) {
    console.error("Error uploading video to Cloudinary:", error);
    throw error; // Throw the error for handling by the caller
  }
}

// Function to upload video link to mongodb

async function uploadVideoLinkToMongoDB(videoLink, topicId) {
  const { midjourneyImageCollection, videoCollection } = await getCollections()
  try {
    
    // Insert document with videoLink and default status
    const result = await videoCollection.insertOne({
      videoLink: videoLink,
      status: "review",
      topicId: topicId,
    });
    console.log(`Video link uploaded to MongoDB with ID: ${result.insertedId}`);
    if (result.insertedId) {
     // Update all matching documents in the MidjourneyImages collection
      const updateResult = await midjourneyImageCollection.updateMany(
        { topicId: topicId }, // Filter documents by topicId
        { $set: { videoStatus: "created" } } // Set new property videoStatus to "created"
      );

      console.log(
        `Updated ${updateResult.matchedCount} documents with videoStatus set to 'created'`
      );
    }
  } catch (error) {
    console.log(`Error uploading video link to MongoDB: ${error}`);
  } finally {
    // await client.close(); // Ensure that the client is closed after the operation
  }
}

// Usage example
async function test(topicId, generatedFiles) {
  console.log("topicId inside test functin ", topicId);
  const videoFileName = `${topicId}_finalVideo.mp4`;
  const videoFilePath = path.join(__dirname,"..","/videoshow", videoFileName);
  // const videoFilePath = path.join(__dirname, "concatFile.mp4");
  console.log("inside test function", videoFileName);
  let cloudinaryLink;
  try {
    // const generatedFiles = await getAllMidjourneyData(topicId);

    // creating video for each quote along with subtitle
    console.log('cloudinary link at starting')
    await createVideoWithGeneratedFiles(generatedFiles, topicId);

    console.log("All videos created and merged successfully.");

    // console.log("Midjourney data:", generatedFiles);

    // concatenate all the videos to make a single video

    await concatenateVideos(topicId);

    console.log("Concatenation done for video");
    // uploading the video in cloudinary

    cloudinaryLink = await uploadVideoToCloudinary(videoFilePath)
      // .then((uploadedVideoUrl) => {
      //   cloudinaryLink = uploadedVideoUrl;
      //   console.log("Video uploaded to Cloudinary:", uploadedVideoUrl);
      // })
      // .catch((error) => {
      //   console.error("Error uploading video:", error);
      // });

    console.log("cludl link", cloudinaryLink);

    // Saving uploaded video link to the database.
    await uploadVideoLinkToMongoDB(cloudinaryLink, topicId);
    console.log("video file link upload complete.");
    return cloudinaryLink;
  } catch (error) {
    console.error("Error in the test function:", error);
    throw error; 
  }
}
const topicId = "098ffce8-5802-42ac-91a6-9c6a06b302f3";

const generatedFiles = [
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.jpg',
      duration: 10.9975
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.jpg',
      duration: 2.925688
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.jpg',
      duration: 4.127313
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.jpg',
      duration: 7.183625
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_5.jpg',
      duration: 6.922438
    }
  ]
// test(topicId, generatedFiles);
app.listen(PORT, () => {
  console.log(`lOCAL HOST RUNNING ON: HTTP://LOCALHOST:${PORT}`);
});
