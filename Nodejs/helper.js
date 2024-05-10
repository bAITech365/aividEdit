const axios = require('axios');
const { connect, db, getCollections } = require('./mongoConnection');
let ChatGPTAPI;
const OpenAI = require('openai');
const fs = require('fs');
const https = require('https');
require('dotenv').config();


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


// async function GPTRun(prompt) {
//   try {
//     // Ensure API key is securely fetched from environment variables
//     const apiKey = 'sk-proj-flBNtJRF6iECImcgt20hT3BlbkFJ3pdQ2Baiwnne2KMwOl2B'
//     // process.env.OPENAI_API_KEY;
//     //'sk-proj-flBNtJRF6iECImcgt20hT3BlbkFJ3pdQ2Baiwnne2KMwOl2B'
//     if (!apiKey) {
//       throw new Error("API key is not available. Please check your environment variables.");
//     }

//     const api = new ChatGPTAPI({
//       apiKey: apiKey,
//       completionParams: {
//         model: 'gpt-3.5-turbo-0125',
//       }
//     });

//     const res = await api.sendMessage(prompt);
//     if (!res || !res.text) {
//       throw new Error("Invalid response from the ChatGPT API.");
//     }

//     console.log('Response from GPT:', res);
//     let result = convertMarkdownToJsonArray(res.text);
//     if (!result || result.length === 0) {
//       throw new Error("Failed to convert markdown to JSON or empty result.");
//     }

//     return result;
//   } catch (error) {
//     console.error(`Error in GPTRun with prompt: ${prompt}`, error);
//     throw error; 
//   }
// }

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
// let errorCount = 0;
// function convertMarkdownToJsonArray(markdownString) {
//    try {
//     // Improved regex to handle more diverse Markdown code block formatting
//     const jsonString = markdownString.replace(/^```json\s+/, '').replace(/\s+```$/, '');

//     // Parse the JSON string into a JavaScript object
//     const jsonArray = JSON.parse(jsonString);

    
//     return jsonArray;
//   } catch (error) {
//     // Increment and log the error with more context
//     console.error(`Conversion error #${++errorCount}:`, error);
//     // Optionally, you could handle the error differently, e.g., rethrow or return null
//     return []; // Return an empty array as a safe fallback
//   }
// }

// async function GPTRunForEach(mainPrompt, substringToReplace, replaceWithStringArray) {
//   let outputArray = [];

//   try {
//     // Map each string in the array to a promise that resolves to the API call result
//     const results = await Promise.all(replaceWithStringArray.map(async (item) => {
//       const replaceWithString = JSON.stringify(item);
//       const finalPrompt = mainPrompt.replace(substringToReplace, replaceWithString);
//       const result = await GPTRun(finalPrompt);
//       return result;
//     }));

//     // Flatten the results and filter out empty results
//     outputArray = results.flat().filter(item => item && item.length);
//   } catch (error) {
//     console.error('Error in GPTRunForEach:', error);
//     throw new Error(`Failed to process all items: ${error.message}`);
//   }

//   return outputArray;
// }

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
      if (!document) {
        throw new Error(`Document not found with the provided filter in collection ${collectionName}`);
      }
  
      if (returnField) {
        return _.get(document, returnField) //|| throw new Error(`Field '${returnField}' not found in document.`);
      }
      return document;
      // if (returnField && document) {
      //     return _.get(document, returnField);
      // } else {
      //     return document;
      // }
  } catch (err) {
    console.error(`Error finding document in ${collectionName}:`, err);
    throw err;
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
        if (jsonArray.length === 0) {
          console.log("No documents to insert.");
          return null; // Or throw an error if this should be considered an operational issue
        }
        const result = await midjourneyImageCollection.insertMany(jsonArray);
        console.log(`${result.insertedCount} documents were inserted`);
        return result;
    } catch (error) {
      console.error(`Error inserting documents into ${collectionName}:`, error);
      throw new Error(`Failed to insert documents: ${error.message}`);
    }
}


module.exports.findFromDB = findFromDB;

async function GetMidjourneyImages(prompts) {
  try {
      const results = await Promise.all(prompts.map(async prompt => {
          try {
              const imageResult = await generateImage(prompt);
              return { success: true, prompt: prompt, result: imageResult };
          } catch (error) {
              console.error(`Failed to generate image for prompt: ${prompt}`, error);
              return { success: false, prompt: prompt, error: error.message };
          }
      }));

      return results;
  } catch (error) {
      console.error('Critical error processing Midjourney images:', error);
      throw error; // Rethrowing the critical error if needed
  }
}
// async function GetMidjourneyImages(prompts) {
//     let outputArray=[];
//     for (let i = 0; i < prompts.length; i++) {
//         const result = await generateImage(prompts[i]);
//         outputArray.push(result);
//     }
//     return outputArray;
// }

module.exports.GetMidjourneyImages = GetMidjourneyImages;

async function generateImage(prompt) {
  const promptComplete = prompt;  
  console.log('prompt for generating images', promptComplete);

  const data = JSON.stringify({
      "prompt": promptComplete,
      "aspect_ratio": "4:3",
      "process_mode": "relax",
      "webhook_endpoint": "",
      "webhook_secret": ""
  });

  const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.midjourneyapi.xyz/mj/v2/imagine',
      headers: {
          'X-API-KEY': process.env.MIDJOURNEY_API_KEY,  // Use environment variable for the API key 5f5ccc8b510fc509f329cf349f8f6687fb91f100b02224582bfe0805ae852fec
          'Content-Type': 'application/json'
      },
      data: data
  };

  try {
      let response = await axios.request(config);
      if (response.status !== 200) {
          throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }
      // console.log(JSON.stringify(response.data));
      return response.data.task_id;
  } catch (error) {
      console.error(`Error MIDJOURNEY generating image: ${error}`);
      throw new Error(`Failed to generate MIDJOURNEY image due to: ${error.message}`);
  }
}


// async function generateImage(prompt) {
//     let promptcomplete = prompt;
//     console.log(promptcomplete);
    
//     let data = JSON.stringify({
//         "prompt": promptcomplete,
//         "aspect_ratio": "4:3",
//         "process_mode": "relax",
//         "webhook_endpoint": "",
//         "webhook_secret": ""
//     });
    
//     let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: 'https://api.midjourneyapi.xyz/mj/v2/imagine',
//         headers: { 
//           'X-API-KEY': '5f5ccc8b510fc509f329cf349f8f6687fb91f100b02224582bfe0805ae852fec', 
//           'Content-Type': 'application/json'
//         },
//         data: data
//     };
    
//     let response = await axios.request(config);
//     console.log(JSON.stringify(response.data));
//     return response.data.task_id;
// }



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

// async function upscaleImage(task_id){

//   data = {
//     "origin_task_id": task_id,
//     "index": "1",
//     "webhook_endpoint": "",
//     "webhook_secret": ""
// }

// let config = {
//   method: 'post',
//   maxBodyLength: Infinity,
//   url: 'https://api.midjourneyapi.xyz/mj/v2/upscale',
//   headers: { 
//     'X-API-KEY': '5f5ccc8b510fc509f329cf349f8f6687fb91f100b02224582bfe0805ae852fec', 
//     'Content-Type': 'application/json'
//   },
//   data: data
// };

// let response = await axios.request(config);
// console.log(JSON.stringify(response.data));
// return response.data.task_id;
// }

async function upscaleImage(task_id) {
  const data = {
      "origin_task_id": task_id,
      "index": "1",  // Ensure this is the correct index for upscaling
      "webhook_endpoint": "",
      "webhook_secret": ""
  };

  let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.midjourneyapi.xyz/mj/v2/upscale',
      headers: { 
          'X-API-KEY': process.env.MIDJOURNEY_API_KEY,  // Using an environment variable for the API key
          'Content-Type': 'application/json'
      },
      data: data
  };

  try {
      let response = await axios.request(config);
      if (response.status !== 200) {
          throw new Error(`API responded with status ${response.status}: ${response.statusText}`);
      }
      console.log(`Upscale successful: ${JSON.stringify(response.data)}`);
      return response.data.task_id;
  } catch (error) {
      console.error(`Error upscaling image for task ID ${task_id}: ${error}`);
      throw new Error(`Failed to upscale image due to: ${error.message}`);
  }
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

  try {
      let response = await axios.post(endpoint, data);

      if (response.status !== 200) {
          throw new Error(`API responded with status code ${response.status}`);
      }

      if (!response.data) {
          throw new Error("No data received from API");
      }

      let result = { status: response.data.status };
      console.log('status of fetched Images', result)

      if (response.data.status === 'finished' && response.data.task_result && response.data.task_result.image_url) {
        return {"status":response.data.status,"image_url": response.data.task_result.image_url}
         
      } 
      
      return {"status":response.data.status};
  } catch (error) {
      console.error(`Error fetching image status for task ID ${task_id}: ${error}`);
      throw new Error(`Failed to fetch image status for task ID ${task_id}: ${error.message}`);
  }
}

// async function fetchImageStatus(task_id) {
//     const endpoint = 'https://api.midjourneyapi.xyz/mj/v2/fetch';
//     const data = { task_id: task_id };
//     let res = await axios.post(endpoint, data);
//     if (res.data && res.data.status === 'finished') {
//      return {"status":res.data.status,"image_url": res.data.task_result.image_url};
//     }
//     return {"status":res.data.status};
// }

module.exports.helper={ setupChatGPTAPI,
                        downloadImage,
                        fetchImageStatus,
                        upscaleImage,
                        GPTRun,
                        GPTRunForEach,
                        bulkInsertDocuments,
                        generateImage,getChatGPTAPI

};



