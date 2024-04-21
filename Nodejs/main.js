import {GPTRun,GPTRunForEach,GetMidjourneyImages,CloudinaryForEach,fetchImageStatus,findFromDB,generateImage,generateImagePrompts,getImageUrl} from "./helper.js";
import {channel} from './config.js'

async function main()
{
    let stories= await GPTRun(channel.Motivation.GetStoriesList);
    let storyDetails=await GPTRunForEach(channel.Motivation.ExplainStory,'O1',stories);
    let Midjourneyprompts= await GPTRunForEach(channel.Motivation.MidjourneyRunPrompt,'O2',storyDetails);
    let images=await GetMidjourneyImages(Midjourneyprompts);
    let channelTags=await GPTRunForEach(channel.Motivation.SocailTags,'O1',stories);
    let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);
}