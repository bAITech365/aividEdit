const { channel } = require('./config.js');
const {helper} = require('./helper.js');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const {MongoClient} = require('mongodb');
const { json } = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { google } = require("googleapis");
require("dotenv").config();
const axios = require('axios');

const oAuth2Client = new google.auth.OAuth2()


// Function to download video from cloudinary
async function downloadVideo(url, outputPath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  //return;
    try {
      //  console.log(channel.Motivation.GetStoriesList);
        let stories=await helper.GPTRun(channel.Motivation.GetStoriesList);
        // let stories=await JSON.parse(result);
          console.log('stories',stories);
  //      console.log(result);

  let storyDetails=[
    {
      topic: 'Success',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Perseverance',
      quote: 'Perseverance is failing 19 times and succeeding the 20th.'
    },
    {
      topic: 'Motivation',
      quote: "Believe you can and you're halfway there."
    },
    {
      topic: 'Motivation',
      quote: 'Success is not final, failure is not fatal: It is the courage to continue that counts.'
    },
    {
      topic: 'Success',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Perseverance',
      quote: 'Perseverance is not a long race; it is many short races one after the other.'
    },
    {
      topic: 'Mindset',
      quote: 'Your mindset is the key to success. Believe in yourself and your abilities.'
    },
    {
      topic: 'Persistence',
      quote: 'Success is not final, failure is not fatal: It is the courage to continue that counts.'
    },
    {
      topic: 'Motivation',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Motivation',
      quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
    },
    {
      topic: 'Motivation',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Motivation',
      quote: 'The only limit to our realization of tomorrow will be our doubts of today.'
    },
    {
      topic: 'Motivation',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Motivation',
      quote: "Believe you can and you're halfway there."
    },
    {
      topic: 'Motivation',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Motivation',
      quote: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.'
    },
    {
      topic: 'Motivation',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Motivation',
      quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
    },
    {
      topic: 'Motivation',
      quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
    },
    {
      topic: 'Motivation',
      quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
    }
  ];
  //await helper.GPTRunForEach(channel.Motivation.ExplainStory,'{O1}',stories);
    //   console.log('storyDetails',storyDetails);
     let Midjourneyprompts= await helper.GPTRunForEach(channel.Motivation.MidjourneyRunPrompt,'{O2}',storyDetails);
     console.log('Midjourneyprompts',Midjourneyprompts);
    Midjourneyprompts.forEach((prompt) => {
      prompt.uid = uuidv4(); // Generate a UUID for uid field
      prompt.status = "Notstarted";
  });
  

    await helper.bulkInsertDocuments("MidjourneyImages", Midjourneyprompts);


    //let channelTags=await GPTRunForEach(channel.Motivation.SocailTags,'O1',stories);
    //let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);

    } catch (error) {
        console.error('Error in main function:', error);
    }
}




// cron job for uploading video to the youtube
cron.schedule('*/30 * * * * *', async () => {
  console.log('Running cron job...' ,new Date());
  try {
    const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
let client = new MongoClient(uri);
async function dbConnect() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db();
}
      const db = await dbConnect();
      const collection = db.collection('FinalVideo');
  // Find documents with status "completed"
  const notUploadedVideo = await collection.find({ status: "completed" }).limit(2).toArray();

  for (const video of notUploadedVideo ){
    const { title, description, videoLink } = video;
    const localPath = path.join(__dirname, `downloaded-${Date.now()}.mp4`);
    await downloadVideo(videoLink, localPath);
  try {
    const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
    const response = await youtube.videos.insert({
      part: "snippet,contentDetails,status",
      requestBody: {
        snippet: {
         title,
         description,
          tags: ["Node.js", "API Upload"],
        },
        status: {
          privacyStatus: "public",
        },
      },
      media: {
        body: fs.createReadStream(localPath),
      },
    });

    
    console.log('youtube response', response)
  } catch (error) {
    console.error("Error uploading video:", error);
  }finally{
    fs.unlinkSync(localPath);
  }
  }

  } catch (error) {
    console.error('Error in uploading youtube video cron job:', error);
  }
});

// cron job for image generation
cron.schedule('*/20 * * * * *', async () => {
  console.log(`
  
  
  `);
  console.log('Running cron job...' ,new Date());
  try {

    const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
let client = new MongoClient(uri);
async function dbConnect() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db();
}
      const db = await dbConnect();
      const collection = db.collection('MidjourneyImages');

      // Find documents with status "Notstarted"
      const notStartedImages = await collection.find({ status: "Notstarted" }).limit(2).toArray();
      const inProgressImages = await collection.find({ status: "InProgess" }).limit(2).toArray();
      const upscalePendingImages = await collection.find({ status: "upscalePending" }).limit(2).toArray();
      // Process each image 
   
      for (const image of notStartedImages) {
          await waitRandom(4000);
          const prompt = image.prompt;
          console.log(`Generating image for ${image._id} ..  ${prompt}...`);
          const task_id = await helper.generateImage(prompt);
          console.log(task_id);
          // Update the status to "InProgess"
          if(task_id)
          { await collection.updateOne({ _id: image._id }, { $set: { status: "InProgess",task_id:task_id } });}

          console.log(`Image generated for ${image._id}`);
      }
      for (const image of inProgressImages) {
          await waitRandom(4000);
          const task_id = image.task_id;
          console.log(`checking image inprogress for ${image._id} ..  ${task_id}...`);
          const {status,image_url} = await helper.fetchImageStatus(task_id);
          console.log(status,image_url);
          // Update the status to "InProgess"
          if(status === 'finished' && image_url)
          { await collection.updateOne({ _id: image._id }, { $set: { status: "upscalePending",image_url:image_url } });
            const upscaleTaskId= await helper.upscaleImage(task_id);
            await collection.updateOne({ _id: image._id }, { $set: { status: "upscalePending",upscaleTaskId:upscaleTaskId } });
        
        }

          console.log(`Image generated for ${image._id}`);
      }
      for (const image of upscalePendingImages) {
          await waitRandom(4000);
          const task_id = image.upscaleTaskId;
          console.log(`checking upscale image for ${image._id} ..  ${task_id}...`);
          const {status,image_url} = await helper.fetchImageStatus(task_id);
          
          console.log(status,image_url);
          // Update the status to "InProgess"
          if(status === 'finished' && image_url)
          { await collection.updateOne({ _id: image._id }, { $set: { status: "finished",upscaleImage_url:image_url } })
         
        }

          console.log(`Image generated for ${image._id}`);
      }

  } catch (error) {
      console.error('Error in cron job:', error);
  }
});

async function waitRandom(miliSeconds)
{
const randomWaitTime = Math.floor(Math.random() * miliSeconds);
console.log(randomWaitTime);
await new Promise(resolve => setTimeout(resolve, randomWaitTime));
}



helper.setupChatGPTAPI().then(() => {
 
    main();  // Now we are sure everything is set up
  }).catch(console.error);