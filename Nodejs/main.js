const { channel } = require('./config.js');
const {helper} = require('./helper.js');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const {MongoClient} = require('mongodb');

async function main() {
    try {
      //  console.log(channel.Motivation.GetStoriesList);
        let result=`[
          "Overcoming challenges",
          "Self-belief and confidence",
          "Success mindset",
          "Persistence and determination",
          "Goal setting and achievement",
          "Positive thinking and attitude",
          "Courage and taking risks",
          "Personal growth and development",
          "Resilience in tough times",
          "Empowerment and inspiration"
      ]`;
//        let result = await GPTRun(channel.Motivation.GetStoriesList);
  //      console.log(result);

  let storyDetails=[
    '```json\n' +
      '[\n' +
      '    {"topic": "Overcoming challenges", "quote": "Success is not final, failure is not fatal: It is the courage to continue that counts."},\n' +
      '    {"topic": "Overcoming challenges", "quote": "The harder the conflict, the more glorious the triumph."},\n' +
      '    {"topic": "Overcoming challenges", "quote": "Challenges are what make life interesting and overcoming them is what makes life meaningful."},\n' +
      `    {"topic": "Overcoming challenges", "quote": "Obstacles don't have to stop you. If you run into a wall, don't turn around and give up. Figure out how to climb it, go through it, or work around it."},\n` +
      `    {"topic": "Overcoming challenges", "quote": "Believe you can and you're halfway there."}\n` +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      '    {"topic": "Self-belief and confidence", "quote": "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle."},\n' +
      `    {"topic": "Self-belief and confidence", "quote": "Confidence is not 'they will like me.' Confidence is 'I'll be fine if they don't'."},\n` +
      '    {"topic": "Self-belief and confidence", "quote": "Self-confidence is the best outfit, rock it and own it."},\n' +
      '    {"topic": "Self-belief and confidence", "quote": "You have within you right now, everything you need to deal with whatever the world can throw at you."},\n' +
      '    {"topic": "Self-belief and confidence", "quote": "The moment you doubt whether you can fly, you cease forever to be able to do it."}\n' +
      ']\n' +
      '```',
    '[\n' +
      '    {"topic": "Success mindset", "quote": "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful."},\n' +
      '    {"topic": "Success mindset", "quote": "Your mindset is everything. Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle."},\n' +
      '    {"topic": "Success mindset", "quote": "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing or learning to do."},\n' +
      '    {"topic": "Success mindset", "quote": "The only limit to our realization of tomorrow will be our doubts of today."},\n' +
      '    {"topic": "Success mindset", "quote": "Your positive action combined with positive thinking results in success."}\n' +
      ']',
    '```json\n' +
      '[\n' +
      '    {"topic": "Persistence and Determination", "quote": "Success is the result of perfection, hard work, learning from failure, loyalty, and persistence."},\n' +
      '    {"topic": "Persistence and Determination", "quote": "It does not matter how slowly you go as long as you do not stop."},\n' +
      `    {"topic": "Persistence and Determination", "quote": "The harder you work for something, the greater you'll feel when you achieve it."},\n` +
      '    {"topic": "Persistence and Determination", "quote": "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful."},\n' +
      '    {"topic": "Persistence and Determination", "quote": "Continuous effort — not strength or intelligence — is the key to unlocking our potential."}\n' +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      `    {"topic": "Goal setting and achievement", "quote": "Set your goals high, and don't stop till you get there."},\n` +
      '    {"topic": "Goal setting and achievement", "quote": "You are never too old to set another goal or to dream a new dream."},\n' +
      '    {"topic": "Goal setting and achievement", "quote": "A goal properly set is halfway reached."},\n' +
      '    {"topic": "Goal setting and achievement", "quote": "The only limit to your impact is your imagination and commitment."},\n' +
      '    {"topic": "Goal setting and achievement", "quote": "Your goals are the road maps that guide you and show you what is possible for your life."}\n' +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      '    {"topic": "Positive thinking and attitude", "quote": "Your positive action combined with positive thinking results in success."},\n' +
      '    {"topic": "Positive thinking and attitude", "quote": "Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence."},\n' +
      '    {"topic": "Positive thinking and attitude", "quote": "Positive thinking will let you do everything better than negative thinking will."},\n' +
      `    {"topic": "Positive thinking and attitude", "quote": "Believe you can and you're halfway there."},\n` +
      '    {"topic": "Positive thinking and attitude", "quote": "Positive thinking is more than just a tagline. It changes the way we behave. And I firmly believe that when I am positive, it not only makes me better, but it also makes those around me better."}\n' +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      '    {"topic": "Courage and Taking Risks", "quote": "Courage is not the absence of fear, but the triumph over it."},\n' +
      '    {"topic": "Courage and Taking Risks", "quote": "Life begins at the end of your comfort zone."},\n' +
      '    {"topic": "Courage and Taking Risks", "quote": "The biggest risk is not taking any risk."},\n' +
      '    {"topic": "Courage and Taking Risks", "quote": "Fortune favors the bold."},\n' +
      '    {"topic": "Courage and Taking Risks", "quote": "You have to take risks. We will only understand the miracle of life fully when we allow the unexpected to happen."}\n' +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      '    {"topic": "Personal growth and development", "quote": "The only person you are destined to become is the person you decide to be."},\n' +
      `    {"topic": "Personal growth and development", "quote": "Don't compare your chapter 1 to someone else's chapter 20. Focus on your own journey."},\n` +
      '    {"topic": "Personal growth and development", "quote": "Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful."},\n' +
      '    {"topic": "Personal growth and development", "quote": "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle."},\n' +
      '    {"topic": "Personal growth and development", "quote": "Personal growth is not a matter of learning new information but of unlearning old limits."}\n' +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      '    {"topic": "Resilience in tough times", "quote": "Tough times never last, but tough people do."},\n' +
      `    {"topic": "Resilience in tough times", "quote": "It's not the load that breaks you down, it's the way you carry it."},\n` +
      `    {"topic": "Resilience in tough times", "quote": "Resilience is accepting your new reality, even if it's less good than the one you had before."},\n` +
      '    {"topic": "Resilience in tough times", "quote": "Rock bottom became the solid foundation on which I rebuilt my life."},\n' +
      '    {"topic": "Resilience in tough times", "quote": "Resilience is all about being able to overcome the unexpected. Sustainability is about survival. The goal of resilience is to thrive."}\n' +
      ']\n' +
      '```',
    '```json\n' +
      '[\n' +
      '    {"topic": "Empowerment", "quote": "The power you have is to be the best version of yourself you can be, so you can create a better world."},\n' +
      '    {"topic": "Inspiration", "quote": "The only way to achieve the impossible is to believe it is possible."},\n' +
      '    {"topic": "Empowerment", "quote": "You are never too old to set another goal or to dream a new dream."},\n' +
      '    {"topic": "Inspiration", "quote": "Success is not final, failure is not fatal: It is the courage to continue that counts."},\n' +
      '    {"topic": "Empowerment", "quote": "Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle."}\n' +
      ']\n' +
      '```'
  ];

  // let stories=await JSON.parse(result);

//        let storyDetails=await GPTRunForEach(channel.Motivation.ExplainStory,'{O1}',stories);
       // console.log(storyDetails);


     let Midjourneyprompts= [
      {
        topic: 'Overcoming challenges',
        quote: 'Success is not final, failure is not fatal: It is the courage to continue that counts.',
        prompt: 'Create an image with a serene landscape featuring a winding road leading towards a distant horizon.'
      },
      {
        topic: 'Overcoming challenges',
        quote: 'The harder the conflict, the more glorious the triumph.',
        prompt: 'Generate an image with a majestic mountain peak shrouded in mist, symbolizing overcoming adversity.'
      },
      {
        topic: 'Overcoming challenges',
        quote: 'Challenges are what make life interesting and overcoming them is what makes life meaningful.',
        prompt: 'Design an image showcasing a butterfly emerging from its chrysalis, representing growth through adversity.'
      },
      {
        topic: 'Overcoming challenges',
        quote: "Obstacles don't have to stop you. If you run into a wall, don't turn around and give up. Figure out how to climb it, go through it, or work around it.",
        prompt: 'Illustrate a figure scaling a steep cliff, embodying perseverance and resilience in the face of obstacles.'
      },
      {
        topic: 'Overcoming challenges',
        quote: "Believe you can and you're halfway there.",
        prompt: 'Craft an image showing a lone tree standing strong in a storm, symbolizing faith and determination.'
      },
      {
        topic: 'Self-belief and confidence',
        quote: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.',
        prompt: 'Generate an image depicting a person standing confidently in front of a large obstacle.'
      },
      {
        topic: 'Self-belief and confidence',
        quote: "Confidence is not 'they will like me.' Confidence is 'I'll be fine if they don't'.",
        prompt: 'Create an image illustrating a person walking confidently away from a group of people.'
      },
      {
        topic: 'Self-belief and confidence',
        quote: 'Self-confidence is the best outfit, rock it and own it.',
        prompt: 'Design an image showing a person wearing a stylish outfit with a confident expression.'
      },
      {
        topic: 'Self-belief and confidence',
        quote: 'You have within you right now, everything you need to deal with whatever the world can throw at you.',
        prompt: 'Illustrate a person holding a shield confidently facing different challenges thrown at them.'
      },
      {
        topic: 'Self-belief and confidence',
        quote: 'The moment you doubt whether you can fly, you cease forever to be able to do it.',
        prompt: 'Create an image symbolizing freedom and potential, with a figure spreading their wings in a moment of doubt.'
      },
      {
        topic: 'Success mindset',
        quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.',
        prompt: 'Generate an image featuring a person fully immersed in their work with a joyful expression, symbolizing the connection between happiness and success.'
      },
      {
        topic: 'Success mindset',
        quote: 'Your mindset is everything. Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.',
        prompt: 'Create an image showing a person confidently facing a large obstacle with a determined look on their face, emphasizing the power of self-belief and a positive mindset.'
      },
      {
        topic: 'Success mindset',
        quote: 'Success is no accident. It is hard work, perseverance, learning, studying, sacrifice, and most of all, love of what you are doing or learning to do.',
        prompt: 'Design an image showcasing different elements of hard work and dedication such as books, a clock, tools, and symbols of various fields, reflecting the essence of deliberate effort leading to success.'
      },
      {
        topic: 'Success mindset',
        quote: 'The only limit to our realization of tomorrow will be our doubts of today.',
        prompt: 'Illustrate an image portraying a person looking towards a bright future while casting away shadows of doubt from the present, symbolizing the importance of overcoming self-doubt for future achievements.'
      },
      {
        topic: 'Success mindset',
        quote: 'Your positive action combined with positive thinking results in success.',
        prompt: 'Craft an image depicting a person engaged in an uplifting activity surrounded by motivational imagery and symbols, highlighting the correlation between positive actions, thoughts, and achieving success.'
      },
      {
        topic: 'Persistence and Determination',
        quote: 'Success is the result of perfection, hard work, learning from failure, loyalty, and persistence.',
        prompt: 'Generate an image with a serene mountain landscape in the background, overlaid with the quote text in an elegant font.'
      },
      {
        topic: 'Persistence and Determination',
        quote: 'It does not matter how slowly you go as long as you do not stop.',
        prompt: 'Create an image depicting a winding road leading towards a distant horizon at sunset, with the quote integrated into the scene.'
      },
      {
        topic: 'Persistence and Determination',
        quote: "The harder you work for something, the greater you'll feel when you achieve it.",
        prompt: 'Design an image featuring a silhouette of a person climbing a steep mountain, with the quote displayed prominently alongside.'
      },
      {
        topic: 'Persistence and Determination',
        quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.',
        prompt: 'Illustrate a vibrant sunrise over a calm beach setting, with the quote elegantly superimposed over the sky.'
      },
      {
        topic: 'Persistence and Determination',
        quote: 'Continuous effort — not strength or intelligence — is the key to unlocking our potential.',
        prompt: 'Craft an image showcasing a seedling growing into a mighty tree, symbolizing growth and perseverance, accompanied by the quote in an artistic font.'
      },
      {
        topic: 'Goal setting and achievement',
        quote: "Set your goals high, and don't stop till you get there.",
        prompt: 'Generate an image featuring a mountain peak symbolizing high goals.'
      },
      {
        topic: 'Goal setting and achievement',
        quote: 'You are never too old to set another goal or to dream a new dream.',
        prompt: 'Create an image showing a person of advanced age reaching for the stars.'
      },
      {
        topic: 'Goal setting and achievement',
        quote: 'A goal properly set is halfway reached.',
        prompt: 'Design an image with a finish line crossed halfway, indicating achieving a goal.'
      },
      {
        topic: 'Goal setting and achievement',
        quote: 'The only limit to your impact is your imagination and commitment.',
        prompt: 'Illustrate an image showcasing a person breaking through a barrier with imagination.'
      },
      {
        topic: 'Goal setting and achievement',
        quote: 'Your goals are the road maps that guide you and show you what is possible for your life.',
        prompt: 'Craft an image with a map overlaying a life journey path towards goals.'
      },
      {
        topic: 'Positive thinking and attitude',
        quote: 'Your positive action combined with positive thinking results in success.',
        prompt: 'Generate an image with a vibrant sunrise over a mountain peak, symbolizing success and positivity.'
      },
      {
        topic: 'Positive thinking and attitude',
        quote: 'Optimism is the faith that leads to achievement. Nothing can be done without hope and confidence.',
        prompt: 'Create an image of a person standing at the edge of a cliff looking out into a sunset, representing optimism and achievement.'
      },
      {
        topic: 'Positive thinking and attitude',
        quote: 'Positive thinking will let you do everything better than negative thinking will.',
        prompt: 'Design an image with a clear sky and a soaring eagle to illustrate the power of positive thinking over negativity.'
      },
      {
        topic: 'Positive thinking and attitude',
        quote: "Believe you can and you're halfway there.",
        prompt: 'Produce an image featuring a winding road leading towards a glowing light, conveying belief and progress.'
      },
      {
        topic: 'Positive thinking and attitude',
        quote: 'Positive thinking is more than just a tagline. It changes the way we behave. And I firmly believe that when I am positive, it not only makes me better, but it also makes those around me better.',
        prompt: 'Illustrate this quote with an image showing a ripple effect of positivity spreading from one person to others in a crowd.'
      },
      {
        topic: 'Courage and Taking Risks',
        quote: 'Courage is not the absence of fear, but the triumph over it.',
        prompt: 'Generate an image with a lion facing a storm, symbolizing courage.'
      },
      {
        topic: 'Courage and Taking Risks',
        quote: 'Life begins at the end of your comfort zone.',
        prompt: 'Create an image with a person stepping out of a comfort zone into a vibrant landscape.'
      },
      {
        topic: 'Courage and Taking Risks',
        quote: 'The biggest risk is not taking any risk.',
        prompt: 'Design an image with a person standing still while the world around them changes.'
      },
      {
        topic: 'Courage and Taking Risks',
        quote: 'Fortune favors the bold.',
        prompt: 'Illustrate a scene with a daring individual embraced by success.'
      },
      {
        topic: 'Courage and Taking Risks',
        quote: 'You have to take risks. We will only understand the miracle of life fully when we allow the unexpected to happen.',
        prompt: 'Visualize a character embracing uncertainty and experiencing the wonders of life.'
      },
      {
        topic: 'Personal growth and development',
        quote: 'The only person you are destined to become is the person you decide to be.',
        prompt: 'Generate an image with a scenic background, featuring a lone figure standing at a crossroads, symbolizing choices and destiny.'
      },
      {
        topic: 'Personal growth and development',
        quote: "Don't compare your chapter 1 to someone else's chapter 20. Focus on your own journey.",
        prompt: 'Create an image with two paths diverging in a forest setting, one with footprints leading forward and another unmarked path, representing individual journeys.'
      },
      {
        topic: 'Personal growth and development',
        quote: 'Success is not the key to happiness. Happiness is the key to success. If you love what you are doing, you will be successful.',
        prompt: 'Design an image with a vibrant sunrise over a mountain peak, illustrating the idea that pursuing happiness leads to success.'
      },
      {
        topic: 'Personal growth and development',
        quote: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.',
        prompt: 'Illustrate this quote with an image of a person standing confidently in front of a large, imposing obstacle, showcasing inner strength and belief.'
      },
      {
        topic: 'Personal growth and development',
        quote: 'Personal growth is not a matter of learning new information but of unlearning old limits.',
        prompt: "Create an image showing a person breaking free from chains labeled 'limits,' symbolizing the process of personal growth through shedding self-imposed restrictions."
      },
      {
        topic: 'Resilience in tough times',
        quote: 'Tough times never last, but tough people do.',
        prompt: 'Create an image depicting a stormy weather scene with a sturdy oak tree standing strong amidst the chaos.'
      },
      {
        topic: 'Resilience in tough times',
        quote: "It's not the load that breaks you down, it's the way you carry it.",
        prompt: 'Generate an image showing a person carrying a heavy burden with a determined expression on their face.'
      },
      {
        topic: 'Resilience in tough times',
        quote: "Resilience is accepting your new reality, even if it's less good than the one you had before.",
        prompt: 'Illustrate a scene of someone embracing change and moving forward despite challenges.'
      },
      {
        topic: 'Resilience in tough times',
        quote: 'Rock bottom became the solid foundation on which I rebuilt my life.',
        prompt: 'Design an image symbolizing a person rising from the depths to build a stronger future.'
      },
      {
        topic: 'Resilience in tough times',
        quote: 'Resilience is all about being able to overcome the unexpected. Sustainability is about survival. The goal of resilience is to thrive.',
        prompt: 'Create a visual representation of overcoming adversity with a focus on growth and flourishing beyond mere survival.'
      },
      {
        topic: 'Empowerment',
        quote: 'The power you have is to be the best version of yourself you can be, so you can create a better world.',
        prompt: 'Generate an image showcasing personal growth and empowerment.'
      },
      {
        topic: 'Inspiration',
        quote: 'The only way to achieve the impossible is to believe it is possible.',
        prompt: 'Create an inspiring image symbolizing belief in the impossible.'
      },
      {
        topic: 'Empowerment',
        quote: 'You are never too old to set another goal or to dream a new dream.',
        prompt: 'Design an image representing continued ambition and goal-setting.'
      },
      {
        topic: 'Inspiration',
        quote: 'Success is not final, failure is not fatal: It is the courage to continue that counts.',
        prompt: 'Illustrate resilience and determination through an imagery of success and failure.'
      },
      {
        topic: 'Empowerment',
        quote: 'Believe in yourself and all that you are. Know that there is something inside you that is greater than any obstacle.',
        prompt: 'Craft an image emphasizing self-belief and overcoming obstacles.'
      }
    ];//await GPTRunForEach(channel.Motivation.MidjourneyRunPrompt,'{O2}',storyDetails);
    // console.log(Midjourneyprompts);
    Midjourneyprompts.forEach((prompt) => {
      prompt.uid = uuidv4(); // Generate a UUID for uid field
      prompt.status = "Notstarted";
  });

    await bulkInsertDocuments("MidjourneyImages", Midjourneyprompts);


    return;



    let images=await GetMidjourneyImages(Midjourneyprompts);
    return;
    let channelTags=await GPTRunForEach(channel.Motivation.SocailTags,'O1',stories);
    let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);

    } catch (error) {
        console.error('Error in main function:', error);
    }
}

cron.schedule('*/5 * * * * *', async () => {
  console.log('Running cron job...' ,new Date());
  try {

    const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function dbConnect() {
  if (!client) {
    client = await MongoClient.connect(uri);
  }
  return client.db();
}
      const db = await dbConnect();
      const collection = db.collection('MidjourneyImages');

      // Find documents with status "Notstarted"
      const notStartedImages = await collection.find({ status: "Notstartedv" }).limit(2).toArray();

      // Process each image 
   
      for (const image of notStartedImages) {
        //await waitRandom(5000);
          console.log(`Generating image for ${image._id}...`);
          // Generate the image
          console.log('generateimage');
          const task_id = await helper.generateImage(image);
          console.log(task_id);
          // Update the status to "InProgess"
          if(task_id)
          { await collection.updateOne({ _id: image._id }, { $set: { status: "InProgessv",task_id:task_id } });}

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
 
 //   main();  // Now we are sure everything is set up
  }).catch(console.error);