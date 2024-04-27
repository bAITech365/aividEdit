const axios = require('axios');
// const {ChatGPTAPI} = require('chatgpt');
let ChatGPTAPI;
async function setupChatGPTAPI() {
    const module = await import('chatgpt');
    ChatGPTAPI = module.ChatGPTAPI;
      // Ensure main is called only after the import completes
}

const OpenAI = require('openai');
const {MongoClient} = require('mongodb');

async function GPTRun(prompt) {
  //console.log(prompt);
  const api = new ChatGPTAPI({
    apiKey: 'sk-proj-flBNtJRF6iECImcgt20hT3BlbkFJ3pdQ2Baiwnne2KMwOl2B' //process.env.OPENAI_API_KEY
  })

  const res = await api.sendMessage(prompt)
  //console.log(res);
  return res.text;
}
async function GPTRunForEach(mainprompt,substringToReplace,replaceWithStringArray)
{
    let outputArray=[];
    //console.log(replaceWithStringArray);
if(true){
    for (let i = 0; i < replaceWithStringArray.length; i++) {
        let prompt = replaceWithStringArray[i];
        let replaceWithString = replaceWithStringArray[i];

        finalPrompt= mainprompt.replace(substringToReplace,replaceWithString);
     //   console.log(finalPrompt)
    result=await GPTRun(finalPrompt);
    outputArray.push(...(convertMarkdownToJsonArray(result)))
    }
   // console.log(outputArray);
  }
    return outputArray
}

function convertMarkdownToJsonArray(markdownString) {
    // Remove the Markdown code block formatting
    const jsonString = markdownString.replace(/^```json\s+/, '').replace(/\s+```$/, '');

    // Parse the JSON string into a JavaScript object
    const jsonArray = JSON.parse(jsonString);

    return jsonArray;
}

const openai = new OpenAI();
const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
let client = new MongoClient(uri);
async function dbConnect() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db();
}
async function findFromDB(collectionName, filter, returnField) {
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
async function insertDocument(collectionName, json) {
    try {
        const db = await dbConnect(); // Ensure we have a DB connection
        const collection = db.collection(collectionName);
        const result = await collection.insertOne(json);
        console.log(`Document inserted with _id: ${result.insertedId}`);
        return result;
    } catch (error) {
        console.error('Error inserting document:', error);
        return null;
    }
}

async function bulkInsertDocuments(collectionName, jsonArray) {
    try {
        const db = await dbConnect(); // Ensure we have a DB connection
        const collection = db.collection(collectionName);
        const result = await collection.insertMany(jsonArray);
        console.log(`${result.insertedCount} documents were inserted`);
        return result;
    } catch (error) {
        console.error('Error inserting documents:', error);
        return null;
    }
}


module.exports.findFromDB = findFromDB;

async function GetMidjourneyImages(prompts) {
    let outputArray=[];
    for (let i = 0; i < prompts.length; i++) {
        const result = await generateImage(prompts[i]);
        outputArray.push(result);
    }
    return outputArray;
}
module.exports.GetMidjourneyImages = GetMidjourneyImages;

async function generateImage(prompt) {
    let promptcomplete = prompt;
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
          'X-API-KEY': '5f5ccc8b510fc509f329cf349f8f6687fb91f100b02224582bfe0805ae852fec', 
          'Content-Type': 'application/json'
        },
        data: data
    };
    
    let response = await axios.request(config);
    console.log(JSON.stringify(response.data));
    return response.data.task_id;
}
async function upscaleImage(task_id){

  data = {
    "origin_task_id": task_id,
    "index": "1",
    "webhook_endpoint": "",
    "webhook_secret": ""
}

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.midjourneyapi.xyz/mj/v2/upscale',
  headers: { 
    'X-API-KEY': '5f5ccc8b510fc509f329cf349f8f6687fb91f100b02224582bfe0805ae852fec', 
    'Content-Type': 'application/json'
  },
  data: data
};

let response = await axios.request(config);
console.log(JSON.stringify(response.data));
return response.data.task_id;
}
async function getImageUrl(task_id) {
    try {
        const imgUrl = await fetchImageStatus(task_id);
        console.log('Image URL:', imgUrl);
        return imgUrl;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function fetchImageStatus(task_id) {
    const endpoint = 'https://api.midjourneyapi.xyz/mj/v2/fetch';
    const data = { task_id: task_id };
    let res = await axios.post(endpoint, data);
    if (res.data && res.data.status === 'finished') {
     return {"status":res.data.status,"image_url": res.data.task_result.image_url};
    }
    return {"status":res.data.status};
}
module.exports.helper={ setupChatGPTAPI,
                        fetchImageStatus,
                        upscaleImage,
                        GPTRun,
                        GPTRunForEach,
                        bulkInsertDocuments,
                        generateImage
};



