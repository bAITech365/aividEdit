const {channel} = require('./config.js')
const {GPTRun,GPTRunForEach,GetMidjourneyImages,CloudinaryForEach,fetchImageStatus,findFromDB,generateImage,generateImagePrompts,getImageUrl} = require('./helper.js')

async function main()
{
    let stories= await GPTRun(channel.Motivation.GetStoriesList);
    let storyDetails=await GPTRunForEach(channel.Motivation.ExplainStory,'O1',stories);
    let Midjourneyprompts= await GPTRunForEach(channel.Motivation.MidjourneyRunPrompt,'O2',storyDetails);
    let images=await GetMidjourneyImages(Midjourneyprompts);
    let channelTags=await GPTRunForEach(channel.Motivation.SocailTags,'O1',stories);
    let FinalMovies=await CloudinaryForEach(images,storyDetails,channel.Motivation.CloudinaryConfig,channelTags);
}

// // Configure Cloudinary with your account details
// const cloudinary = require('cloudinary').v2
// cloudinary.config({
//     cloud_name: 'doyry0ttt',
//     api_key: '447229656995129',
//     api_secret: 'cZVTKK_zWBLpi3eeML6PcDKS2E4'
// });

// // Function to upload and transform an image with zoom pan effect
// async function uploadAndTransformImage(imagePath) {
//     try {
//         const result = await cloudinary.uploader.upload(imagePath, {
//             public_id: "sample_transformed", // Optional: specify the public ID of the uploaded image
//             transformation: [
//                 { width: 250, height: 250, crop: "fill" }, // Resize action
//                 { effect: "zoompan:to_(g_auto)" },          // Zoom pan effect
//                 { effect: "loop" },                         // Loop effect
//                 { fetch_format: "auto", quality: "auto" }   // Format and quality optimization
//             ]
//         });

//         console.log('Uploaded and transformed image URL:', result.secure_url);
//     } catch (error) {
//         console.error('Error uploading and transforming image:', error);
//     }
// }



// // Call the function with the path to your image
// uploadAndTransformImage('./sample.jpg');
