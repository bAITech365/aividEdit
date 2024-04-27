let channel=
{
    Motivation:{
        GetStoriesList:'Only respond in Json Format in format: [<topic1 >,<topic2>,...]. Please provide 10 Topics for a Motivational topics channel. We will share 2 quotes each day on 1 topic.' ,
        ExplainStory:'Only respond in Json Format [{"topic": "<>","quote": "<>"},...]. Give me 2 motivational quotes on the topic {O1}',
        MidjourneyRunPrompt:'I want to generate image on which i can show these quotes . Please provide a prompt for image generation for each of the provided quote in a json format [{"topic": "<>","quote": "<>","prompt":"<>"},...] . Quotes are following {O2}',        
        SocailTags:'Please provide Social Media Tags, Topic Title, Thumbnail suggestion for this topic O1',
        CloudinaryConfig:{}
    }
  
}

module.exports = { channel };