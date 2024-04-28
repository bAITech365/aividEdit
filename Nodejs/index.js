const { generateVoice  } = require('../videoshow/helper');

const fakeData = [
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
  }
];




async function main() {
    try {
        const topic = 'Motivation'; // Fake topic for testing
        const quotes = fakeData.map(item => item.quote);

        // Fake images for testing
        const images = [
            'https://media.istockphoto.com/id/1264156957/photo/young-man-in-the-city-reaching-his-goals.jpg?s=612x612&w=0&k=20&c=-xtXMjc8CecrJWLkETw6yk6-yVhswh7w1_uh5ele820=',
            'https://images.ctfassets.net/txbhe1wabmyx/1rYV5ca3R7Foi02XHBQGOy/61fa9a0d320fdea407d61eec2f9bd27e/josh-gordon-fzHmP6z8OQ4-unsplash.jpg',
            'https://www.univariety.com/blog/wp-content/uploads/2014/08/motivational-goals-1200x1200.jpg',
            'https://papertyari.com/wp-content/uploads/2019/02/motivation-1024x568.jpg',
            'https://www.emotionalintelligencecourse.com/wp-content/uploads/2022/06/Motivation.jpg'
        ];

        // Generate audio from the fake quotes
        for (const data of fakeData) {
          const audioFile = await generateVoice(data.quote);
          console.log('Audio file generated:', audioFile);
      }
        // await createSlideshow(images, audioFile);
    } catch (error) {
        console.error('Error in main function:', error);
    }
}

async function createSlideshow(images, audioFile) {
    // Your code to create the slideshow using videoshow
}

// Invoke the main function
main();




// const express = require('express');
// const axios = require('axios');
// const app = express();
// const port = 3000;
// app.use(express.json());

// const { MongoClient } = require('mongodb');
// const fakeData = [
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   },
//   {
//       topic: 'Motivation',
//       quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle."
//   },
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   },
//   {
//       topic: 'Motivation',
//       quote: 'The only limit to our realization of tomorrow will be our doubts of today.'
//   },
//   {
//       topic: 'Motivation',
//       quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.'
//   }
// ];


// const images = ['https://media.istockphoto.com/id/1264156957/photo/young-man-in-the-city-reaching-his-goals.jpg?s=612x612&w=0&k=20&c=-xtXMjc8CecrJWLkETw6yk6-yVhswh7w1_uh5ele820=', 'https://images.ctfassets.net/txbhe1wabmyx/1rYV5ca3R7Foi02XHBQGOy/61fa9a0d320fdea407d61eec2f9bd27e/josh-gordon-fzHmP6z8OQ4-unsplash.jpg', 'https://www.univariety.com/blog/wp-content/uploads/2014/08/motivational-goals-1200x1200.jpg', 'https://papertyari.com/wp-content/uploads/2019/02/motivation-1024x568.jpg', 'https://www.emotionalintelligencecourse.com/wp-content/uploads/2022/06/Motivation.jpg']

// async function getAllMidjourneyData() {
//   try {
//     // MongoDB connection URI
//     const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";

//     // Connect to MongoDB
//     const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//     await client.connect();

//     // Access the tradingdb database
//     const db = client.db();

//     // Access the Midjourney collection
//     const collection = db.collection('MidjourneyImages');
    
//     const topic = 'Motivation'
//     const documents = await collection.find({ topic: topic }).project({ _id: 0, image_url: 1 }).toArray();

//     // Close the connection

   
//     client.close();

//     const imageURLs = documents.map(doc => doc.image_url);

//     return imageURLs;
//   } catch (error) {
//     console.error('Error:', error);
//     throw error;
//   }
// }

// // Usage example
// async function test() {
//   try {
//     const midjourneyData = await getAllMidjourneyData();
//     console.log('Midjourney data:', midjourneyData);
//     // You can perform further testing or processing here
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// // Call the test function to retrieve and log the Midjourney data
// test();
