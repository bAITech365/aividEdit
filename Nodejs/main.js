// const { channel } = require('./config.js');
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

 // let storyDetails=[
  //   {
  //     topic: 'Success',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Perseverance',
  //     quote: 'Perseverance is failing 19 times and succeeding the 20th.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: "Believe you can and you're halfway there."
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not final, failure is not fatal: It is the courage to continue that counts.'
  //   },
  //   {
  //     topic: 'Success',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Perseverance',
  //     quote: 'Perseverance is not a long race; it is many short races one after the other.'
  //   },
  //   {
  //     topic: 'Mindset',
  //     quote: 'Your mindset is the key to success. Believe in yourself and your abilities.'
  //   },
  //   {
  //     topic: 'Persistence',
  //     quote: 'Success is not final, failure is not fatal: It is the courage to continue that counts.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'The only limit to our realization of tomorrow will be our doubts of today.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: "Believe you can and you're halfway there."
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
  //   },
  //   {
  //     topic: 'Motivation',
  //     quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
  //   }
  // ];

  //  console.log(channel.Motivation.GetStoriesList);
  // let x = channel.Motivation.GetStoriesList.replace("{topicCount}", "{1}");
  // let y = x.replace("{topicName}", "{user}");
  //   let stories=await helper.GPTRun(y);

  // let stories=await JSON.parse(result);


async function main(modifiedChannel, seriesId) {
  console.log('series id inside main ', seriesId)
  //return;
  console.log('modified channel inside main', modifiedChannel)
    try {
      let stories=await helper.GPTRun(modifiedChannel.Motivation.GetStoriesList);
          console.log('stories',stories);
  //      console.log(result);

 
  let storyDetails = await helper.GPTRunForEach(modifiedChannel.Motivation.ExplainStory,'{O1}',stories);
      console.log('storyDetails in main',storyDetails);

     let Midjourneyprompts= await helper.GPTRunForEach(modifiedChannel.Motivation.MidjourneyRunPrompt,'{O1}',storyDetails);

     console.log('Midjourneyprompts main',Midjourneyprompts);

     let topicId = uuidv4(); 
    Midjourneyprompts.forEach((prompt) => {
      prompt.topicId = topicId;
      prompt.status = "Notstarted";
      prompt.seriesId = seriesId
  });
  

    await helper.bulkInsertDocuments("MidjourneyImages", Midjourneyprompts);

    const job = cron.schedule('*/20 * * * * *', async () => {
      await cronJob(seriesId); 
    });
    // let channelTags=await GPTRunForEach(modifiedChannel.Motivation.SocailTags,'O1',stories);
// Wait for all images to reach a final state (example: "finished")
await waitForAllImagesToFinish(seriesId, job);

// Stop the cron job after completion
job.stop();
    // let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);
    return topicId;
    } catch (error) {
        console.error('Error in main function:', error);
        return null;
    }
}

async function waitForAllImagesToFinish(seriesId, job, timeout = 600000) {
  const startTime = Date.now();
  const checkInterval = 2000; // check every 5 seconds

  return new Promise(async (resolve, reject) => {
    const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
    let client = new MongoClient(uri);
    async function dbConnect() {
      if (!client) {
        client = await MongoClient.connect(uri);
      }
      return client.db();
    }
      const checkCompletion = async () => {
          try {
              const db = await dbConnect();
              const collection = db.collection('MidjourneyImages');
              const count = await collection.countDocuments({ seriesId: seriesId, status: { $ne: "finished" } });

              if (count === 0) {
                  console.log("All images are processed and finished.");
                  job.stop(); // Stop the cron job if all images are finished.
                  resolve();
              } else if (Date.now() - startTime > timeout) {
                  console.log("Timeout reached while waiting for images to finish.");
                  job.stop(); // Stop the cron job in case of timeout.
                  reject(new Error("Timeout reached"));
              } else {
                  setTimeout(checkCompletion, checkInterval); // Schedule the next check.
              }
          } catch (error) {
              console.error("Error checking image completion status:", error);
              reject(error);
          }
      };

      setTimeout(checkCompletion, checkInterval); // Initial check after the first interval.
  });
}



async function cronJob(seriesId) {
  console.log(`seried id inside cron job`, seriesId);
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
      const notStartedImages = await collection.find({ status: "Notstarted", seriesId: seriesId}).limit(2).toArray();
      const inProgressImages = await collection.find({ status: "InProgess", seriesId: seriesId}).limit(2).toArray();
      const upscalePendingImages = await collection.find({ status: "upscalePending", seriesId: seriesId}).limit(2).toArray();
      // Process each image 
      console.log('Before NotStarted')  
      for (const image of notStartedImages) {
        console.log('NotStarted')  
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
      return Promise.resolve();
  } catch (error) {
      console.error('Error in cron job:', error);
  }
}

// cron.schedule('*/20 * * * * *', async () => {
//   await cronJob(); 
// });

// cron.schedule('*/20 * * * * *', async () => {
//   console.log(`
  
  
//   `);
//   console.log('Running cron job...' ,new Date());
//   try {

//     const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
// let client = new MongoClient(uri);
// async function dbConnect() {
//   if (!client) {
//     client = await MongoClient.connect(uri);
//   }
//   return client.db();
// }
//       const db = await dbConnect();
//       const collection = db.collection('MidjourneyImages');

//       // Find documents with status "Notstarted"
//       const notStartedImages = await collection.find({ status: "Notstarted" }).limit(2).toArray();
//       const inProgressImages = await collection.find({ status: "InProgess" }).limit(2).toArray();
//       const upscalePendingImages = await collection.find({ status: "upscalePending" }).limit(2).toArray();
//       // Process each image 
   
//       for (const image of notStartedImages) {
//           await waitRandom(4000);
//           const prompt = image.prompt;
//           console.log(`Generating image for ${image._id} ..  ${prompt}...`);
//           const task_id = await helper.generateImage(prompt);
//           console.log(task_id);
//           // Update the status to "InProgess"
//           if(task_id)
//           { await collection.updateOne({ _id: image._id }, { $set: { status: "InProgess",task_id:task_id } });}

//           console.log(`Image generated for ${image._id}`);
//       }
//       for (const image of inProgressImages) {
//           await waitRandom(4000);
//           const task_id = image.task_id;
//           console.log(`checking image inprogress for ${image._id} ..  ${task_id}...`);
//           const {status,image_url} = await helper.fetchImageStatus(task_id);
//           console.log(status,image_url);
//           // Update the status to "InProgess"
//           if(status === 'finished' && image_url)
//           { await collection.updateOne({ _id: image._id }, { $set: { status: "upscalePending",image_url:image_url } });
//             const upscaleTaskId= await helper.upscaleImage(task_id);
//             await collection.updateOne({ _id: image._id }, { $set: { status: "upscalePending",upscaleTaskId:upscaleTaskId } });
        
//         }

//           console.log(`Image generated for ${image._id}`);
//       }
//       for (const image of upscalePendingImages) {
//           await waitRandom(4000);
//           const task_id = image.upscaleTaskId;
//           console.log(`checking upscale image for ${image._id} ..  ${task_id}...`);
//           const {status,image_url} = await helper.fetchImageStatus(task_id);
          
//           console.log(status,image_url);
//           // Update the status to "InProgess"
//           if(status === 'finished' && image_url)
//           { await collection.updateOne({ _id: image._id }, { $set: { status: "finished",upscaleImage_url:image_url } })
         
//         }

//           console.log(`Image generated for ${image._id}`);
//       }

//   } catch (error) {
//       console.error('Error in cron job:', error);
//   }
// });


async function waitRandom(miliSeconds)
{
const randomWaitTime = Math.floor(Math.random() * miliSeconds);
console.log(randomWaitTime);
await new Promise(resolve => setTimeout(resolve, randomWaitTime));
}




// // cron job for uploading video to the youtube
// cron.schedule('*/30 * * * * *', async () => {
//   console.log('Running cron job...' ,new Date());
//   try {
//     const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
// let client = new MongoClient(uri);
// async function dbConnect() {
//   if (!client) {
//     client = await MongoClient.connect(uri);
//   }
//   return client.db();
// }
//       const db = await dbConnect();
//       const collection = db.collection('FinalVideo');
//   // Find documents with status "completed"
  
//   const notUploadedVideo = await collection.find({ status: "completed" }).limit(2).toArray();

//   for (const video of notUploadedVideo ){
//     const { title, description, videoLink } = video;
//     const localPath = path.join(__dirname, `downloaded-${Date.now()}.mp4`);
//     await downloadVideo(videoLink, localPath);
//   try {
//     const youtube = google.youtube({ version: "v3", auth: oAuth2Client });
//     const response = await youtube.videos.insert({
//       part: "snippet,contentDetails,status",
//       requestBody: {
//         snippet: {
//          title,
//          description,
//           tags: ["Node.js", "API Upload"],
//         },
//         status: {
//           privacyStatus: "public",
//         },
//       },
//       media: {
//         body: fs.createReadStream(localPath),
//       },
//     });

    
//     console.log('youtube response', response)
//   } catch (error) {
//     console.error("Error uploading video:", error);
//   }finally{
//     fs.unlinkSync(localPath);
//   }
//   }

//   } catch (error) {
//     console.error('Error in uploading youtube video cron job:', error);
//   }
// });

module.exports = { main:main, cronJob: cronJob };

// helper.setupChatGPTAPI().then(() => {
 
//     main();  // Now we are sure everything is set up
//   }).catch(console.error);