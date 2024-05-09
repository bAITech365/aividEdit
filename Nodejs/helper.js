const axios = require('axios');
const { connect, db, getCollections } = require('./mongoConnection');
let ChatGPTAPI;
const OpenAI = require('openai');
const fs = require('fs');
const https = require('https');


async function dbConnect() {
  if (!db) {
      const connection = await connect();
      return connection.db; // Ensure the database instance is returned
  }
  return db;
}



async function setupChatGPTAPI() {
  if (!ChatGPTAPI) {
      const module = await import('chatgpt');
      ChatGPTAPI = module.ChatGPTAPI;
  }
  return ChatGPTAPI;  // Return the initialized API
}

function getChatGPTAPI() {
  return ChatGPTAPI;  // Returns the initialized API or undefined
}




async function GPTRun(prompt) {
 // console.log('GPTRun',prompt);
  const api = new ChatGPTAPI({
    apiKey: 'sk-proj-flBNtJRF6iECImcgt20hT3BlbkFJ3pdQ2Baiwnne2KMwOl2B', //process.env.OPENAI_API_KEY,
    completionParams: {
      model: 'gpt-3.5-turbo-0125',
    }
  
  })

  const res = await api.sendMessage(prompt)
 // console.log(res);
  let result= convertMarkdownToJsonArray(res.text)
  return result;
}
async function GPTRunForEach(mainprompt,substringToReplace,replaceWithStringArray)
{
    let outputArray=[];
//    console.log('GPTRunForEach' ,replaceWithStringArray);
if(true){
    for (let i = 0; i < replaceWithStringArray.length; i++) {
        let prompt = replaceWithStringArray[i];
        let replaceWithString =await JSON.stringify(replaceWithStringArray[i]);
        
        finalPrompt= mainprompt.replace(substringToReplace,replaceWithString);
      //  console.log('finalPrompt',finalPrompt);
    result=await GPTRun(finalPrompt);
    //console.log(result.length);
    if (result.length) outputArray.push(...result);
    // console.log(outputArray.length);
   // console.log(outputArray);
  }
  // console.log('gptrun for each', outputArray)
    return outputArray
}
}


let errorcount=0;
function convertMarkdownToJsonArray(markdownString) {
  let jsonArray=[];
  try {
      // console.log('convertMarkdownToJsonArray',markdownString);
    // Remove the Markdown code block formatting
    const jsonString = markdownString.replace(/^```json\s+/, '').replace(/\s+```$/, '');

    // Parse the JSON string into a JavaScript object
     jsonArray = JSON.parse(jsonString);

  } catch (e) {
    console.log(errorcount++);
  }

    return jsonArray;
}

const openai = new OpenAI();
// const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
// let client = new MongoClient(uri, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   tls: true,
// });
// async function dbConnect() {
//   if (!client) {
//     client = await MongoClient.connect(uri);
//   }
//   return client.db();
// }
async function findFromDB(collectionName, filter, returnField) {
  const { midjourneyImageCollection} = await getCollections()
  try {
     
      filter = filter || {};
      // const collection = db.collection(collectionName);
      const document = await midjourneyImageCollection.findOne(filter);
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
  const { midjourneyImageCollection } = await getCollections()
    try {
        // const db = await dbConnect(); // Ensure we have a DB connection
        // const collection = db.collection(collectionName);
        const result = await midjourneyImageCollection.insertOne(json);
        console.log(`Document inserted with _id: ${result.insertedId}`);
        return result;
    } catch (error) {
        console.error('Error inserting document:', error);
        return null;
    }
}

async function bulkInsertDocuments(collectionName, jsonArray) {
  const { midjourneyImageCollection } = await getCollections()
    try {
        // const db = await dbConnect(); // Ensure we have a DB connection
        // const collection = db.collection(collectionName);
        const result = await midjourneyImageCollection.insertMany(jsonArray);
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

// Function to download and save the image
const downloadImage = (url, filePath) => {
  const file = fs.createWriteStream(filePath);
  https.get(url, response => {
    response.pipe(file);

    // Close the file once download is complete
    file.on('finish', () => {
      file.close();
      console.log('Download complete.');
    });
  }).on('error', error => {
    // Handle errors
    console.error('Error downloading the image:', error.message);
    fs.unlink(filePath, () => {}); // Delete the file asynchronously on error
  });
};

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
                        downloadImage,
                        fetchImageStatus,
                        upscaleImage,
                        GPTRun,
                        GPTRunForEach,
                        bulkInsertDocuments,
                        generateImage,getChatGPTAPI

};



