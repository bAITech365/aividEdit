import axios from "axios";
import { ChatGPTAPI } from 'chatgpt'

async function GPTRun(prompt) {
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
  })

  const res = await api.sendMessage(prompt)
  return res.text;
}
async function GPTRunForEach(prompts,substringToReplace,replaceWithStringArray)
{
    let outputArray=[];
    for (let i = 0; i < prompts.length; i++) {
        let prompt = prompts[i];
        let replaceWithString = replaceWithStringArray[i];
        finalPrompt= prompt.replace(substringToReplace,replaceWithString);
        result=await GPTRun(finalPrompt);
        outputArray.push(result);
    }
    return outputArray
}



import OpenAI from "openai";
const openai = new OpenAI();
import { MongoClient } from "mongodb";
const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function dbConnect() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db();
}
export async function findFromDB(collectionName, filter, returnField) {
  try {
      const db = await dbConnect();
      if (!collectionName) throw new Error('collection not defined');
      filter = filter || {};
      const collection = db.collection(collectionName);
      const document = await collection.findOne(filter);
      if (returnField && document) {
          return _.get(document, returnField);
      } else {
          return document;
      }
  } catch (err) {
      console.error(err);
      return null;
  }
}
// let symConf=findFromDB('TradingData',{symbol:position.tradingSymbol});
// const db = await dbConnect();
// const orderCollection = db.collection('chartInkCalls');
// const cIId = await orderCollection.insertOne(req.body);

export async function GetMidjourneyImages(prompts) {
    let outputArray=[];
    for (let i = 0; i < prompts.length; i++)
{        const e = prompts[i];
    const result = await generateImage(prompt);
    outputArray.push(result);
}
    return outputArray
  }
  
  // Call the function
  //generateImagePrompts(stories);
  export async function generateImage(prompt)
  {
    let promptcomplete=prompt;
    console.log(promptcomplete);
    
    let data = JSON.stringify({
        "prompt": promptcomplete,
        "aspect_ratio": "4:3",
        "process_mode": "relax",
        "webhook_endpoint": "",
        "webhook_secret": ""
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://api.midjourneyapi.xyz/mj/v2/imagine',
        headers: { 
          'X-API-KEY': '216258bd856c5f139e137034b621e6f680ec359d10b16db36acc96051d844f03', 
          'Content-Type': 'application/json'
        },
        data : data
      };
      
      let response=await axios.request(config);
      console.log(JSON.stringify(response.data));
      return response.data.task_id;    
      
  }
  export async function getImageUrl(task_id) {
    try {
      const imgUrl = await fetchImageStatus(task_id);
      console.log('Image URL:', imgUrl);
      // Handle the imgUrl as needed
      return imgUrl;
    } catch (error) {
      console.error('Error:', error);
      // Handle the error as needed
      throw error;
    }
  }
  export async function fetchImageStatus(task_id) {
    const endpoint = 'https://api.midjourneyapi.xyz/mj/v2/fetch';
    const data = { task_id: task_id };
  
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          let res = await axios.post(endpoint, data);
        
          if (res.data && res.data.status === 'finished') {
            clearInterval(checkInterval); // Stop checking
            resolve(res.data.task_result.image_url); // Resolve promise with imgUrl
          } else if (res.data && res.data.status === 'error') {
            clearInterval(checkInterval); // Stop checking
            reject(new Error('Task ended with error status.'));
          }
          // If status is not 'success', the function will continue to check every 5 seconds
        } catch (error) {
          clearInterval(checkInterval); // Ensure we clear the interval on error to avoid memory leak
          reject(error); // Reject the promise if an error occurs
        }
      }, 5000); // Check every 5 seconds
    });
  }
  

  let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);