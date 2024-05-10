const { connect, getCollections } = require("./mongoConnection");
const { helper } = require("./helper.js");
const { v4: uuidv4 } = require("uuid");
const cron = require("node-cron");
const { MongoClient } = require("mongodb");
const { json } = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");
require("dotenv").config();
const axios = require("axios");

const oAuth2Client = new google.auth.OAuth2();

// Function to download video from cloudinary
async function downloadVideo(url, outputPath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
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

async function fetchStories(modifiedChannel) {
  const stories = await helper.GPTRun(
    modifiedChannel.Motivation.GetStoriesList
  );
  if (!stories || stories.length === 0)
    throw new Error("No stories returned from GPT run.");
  console.log("Stories:", stories);
  return stories;
}

async function explainStories(modifiedChannel, stories) {
  const storyDetails = await helper.GPTRunForEach(
    modifiedChannel.Motivation.ExplainStory,
    "{O2}",
    stories
  );
  console.log("StoryDetails in main:", storyDetails);
  if (!storyDetails || storyDetails.length < 5)
    throw new Error(
      "No or insufficient explain story returned from GPTRunForEach."
    );
  return storyDetails;
}

async function generateMidJourneyPrompts(modifiedChannel, storyDetails) {
  try {
    const prompts = await helper.GPTRunForEach(
      modifiedChannel.Motivation.MidjourneyRunPrompt,
      "{O2}",
      storyDetails
    );
    if (!prompts || prompts.length < 4) {
      throw new Error("Insufficient MidJourney prompts returned.");
    }
    return prompts;
  } catch (error) {
    console.error(`Error generating MidJourney prompts: ${error}`);
    throw new Error(`Failed to generate MidJourney prompts: ${error.message}`);
  }
}

async function setupMidJourneyImages(prompts, seriesId) {
  try {
    const topicId = uuidv4();
    prompts.forEach((prompt) => {
      prompt.topicId = topicId;
      prompt.status = "Not started";
      prompt.seriesId = seriesId;
    });
    await helper.bulkInsertDocuments("MidjourneyImages", prompts);
    return topicId;
  } catch (error) {
    console.error(`Error setting up MidJourney images: ${error}`);
    throw new Error(`Failed to setup MidJourney images: ${error.message}`);
  }
}

async function manageImageProcessing(topicId, seriesId) {
  const job = scheduleCronJob(seriesId);
  try {
    await waitForAllImagesToFinish(seriesId, job);
    console.log("All images processed successfully.");
  } catch (error) {
    console.error(`Error waiting for image processing: ${error}`);
    throw new Error(
      `Failed due to timeout or other error in image processing: ${error.message}`
    );
  } finally {
    job.stop();
  }
}

function scheduleCronJob(seriesId) {
  try {
    return cron.schedule("*/30 * * * * *", async () => {
      await cronJob(seriesId);
    });
  } catch (error) {
    console.error(`Error scheduling cron job: ${error}`);
    throw new Error(`Failed to schedule cron job: ${error.message}`);
  }
}

// modified channel inside main {
//   Motivation: {
//     GetStoriesList: 'Only respond in Json Format in format: [<topic1 >,<topic2>,...]. Please provide 1 Topics for a Life Pro Tips topics channel. We will share 2 quotes each day on 1 topic.',
//     ExplainStory: 'Only respond in Json Format [{"topic": "<>","quote": "<>"},...]. Give me 5 quotes on the topic {O1}',
//     MidjourneyRunPrompt: 'I want to generate image on which i can show these quotes . Please provide a prompt for image generation for each of the provided quote in a json format [{"topic": "<>","quote": "<>","prompt":"<>"},...] . Quotes are following {O2}',
//     SocailTags: 'Please provide Social Media Tags, Topic Title, Thumbnail suggestion for this topic O1',
//     CloudinaryConfig: {}
//   }
// }

async function main(modifiedChannel, seriesId) {
  console.log("series id inside main ", seriesId);
  console.log("modified channel inside main", modifiedChannel);

  try {
    const stories = await fetchStories(modifiedChannel);
    const storyDetails = await explainStories(modifiedChannel, stories);
    const midJourneyPrompts = await generateMidJourneyPrompts(
      modifiedChannel,
      storyDetails
    );

    // const topicId = setupMidJourneyImages(midJourneyPrompts, seriesId);

    const topicId = setupMidJourneyImages(midJourneyPrompts, seriesId);

    await manageImageProcessing(topicId, seriesId);

    // const job = cron.schedule("*/60 * * * * *", async () => {
    //   await cronJob(seriesId);
    // });
    // let channelTags=await GPTRunForEach(modifiedChannel.Motivation.SocailTags,'O1',stories);
    // Wait for all images to reach a final state (example: "finished")
    //   try {
    //     await waitForAllImagesToFinish(seriesId, job);
    //     console.log("All images processing finished successfully.");
    //   } catch (error) {
    //     console.error(`Error waiting for image processing: ${error}`);
    // // Include original error message for better context
    // throw new Error(`Failed due to timeout or other error in image processing: ${error.message}`);
    //   } finally {
    //     job.stop();  // Ensure that the cron job is stopped regardless of success or failure.
    //   }
    console.log("Topic id after try catch", topicId);
    // let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);
    return topicId;
  } catch (error) {
    console.error("Error in main function:", error);
    return null;
  }
}

async function waitForAllImagesToFinish(seriesId, job, timeout = 600000) {
  const startTime = Date.now();
  const checkInterval = 60000;

  return new Promise(async (resolve, reject) => {
    // const uri =
    //   "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
    // let client = new MongoClient(uri);
    // async function dbConnect() {
    //   if (!client) {
    //     client = await MongoClient.connect(uri);
    //   }
    //   return client.db();
    // }
    const checkCompletion = async () => {
      const { midjourneyImageCollection } = await getCollections();
      try {
        const count = await midjourneyImageCollection.countDocuments({
          seriesId: seriesId,
          status: { $ne: "finished" },
        });

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
  console.log("Running cron job...", new Date());
  const { midjourneyImageCollection } = await getCollections();
  try {
    // const db = await connect();

    // Find documents with status "Notstarted"
    const notStartedImages = await midjourneyImageCollection
      .find({ status: "Notstarted", seriesId: seriesId })
      .limit(2)
      .toArray();
    const inProgressImages = await midjourneyImageCollection
      .find({ status: "InProgess", seriesId: seriesId })
      .limit(2)
      .toArray();
    const upscalePendingImages = await midjourneyImageCollection
      .find({ status: "upscalePending", seriesId: seriesId })
      .limit(2)
      .toArray();
    // Process each image
    for (const image of notStartedImages) {
      console.log("NotStarted");
      await waitRandom(4000);
      const prompt = image.prompt;
      // console.log(`Generating image for notStartedImages ${image._id} ..  ${prompt}...`);
      const task_id = await helper.generateImage(prompt);
      console.log("image generated for: ", task_id);

      // Update the status to "InProgess"
      if (task_id) {
        await midjourneyImageCollection.updateOne(
          { _id: image._id },
          { $set: { status: "InProgess", task_id: task_id } }
        );
        console.log(
          `Image stored to mongodb for from notStarted loop ${image._id}`
        );
      }
    }
    for (const image of inProgressImages) {
      await waitRandom(4000);
      const task_id = image.task_id;
      console.log(
        `checking image inprogress for ${image._id} .. for ${task_id}...`
      );
      const { status, image_url } = await helper.fetchImageStatus(task_id);
      console.log("fetch status from midjourney", status, image_url);
      // Update the status to "InProgess"
      if (status === "finished" && image_url) {
        await midjourneyImageCollection.updateOne(
          { _id: image._id },
          { $set: { status: "upscalePending", image_url: image_url } }
        );
        const upscaleTaskId = await helper.upscaleImage(task_id);
        await midjourneyImageCollection.updateOne(
          { _id: image._id },
          { $set: { status: "upscalePending", upscaleTaskId: upscaleTaskId } }
        );
        console.log(
          `Image stored to mongodb for upscale pending inside inprogress loop ${image._id}`
        );
      }
    }
    for (const image of upscalePendingImages) {
      await waitRandom(4000);
      const task_id = image.upscaleTaskId;
      console.log(
        `checking upscale image for ${image._id} .. for task id of ${task_id}...`
      );
      const { status, image_url } = await helper.fetchImageStatus(task_id);

      console.log(status, image_url);
      // Update the status to "InProgess"
      if (status === "finished" && image_url) {
        await midjourneyImageCollection.updateOne(
          { _id: image._id },
          { $set: { status: "finished", upscaleImage_url: image_url } }
        );
        console.log(
          `Image generated for upscale inside upscalePending loop ${image._id}`
        );
      }
    }
    return Promise.resolve();
  } catch (error) {
    throw new Error(`Error in cron job: ${error}`);
  }
}

async function waitRandom(miliSeconds) {
  const randomWaitTime = Math.floor(Math.random() * miliSeconds);
  console.log("random wait time", randomWaitTime);
  await new Promise((resolve) => setTimeout(resolve, randomWaitTime));
}

module.exports = { main: main, cronJob: cronJob };
