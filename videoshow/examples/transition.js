var videoshow = require('../')
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



function calculateLoopDuration(audioDuration) {
     return Math.ceil(audioDuration);
}

async function createVideoWithGeneratedFiles(generatedFiles, topicId) {
    if (!generatedFiles || generatedFiles.length === 0) {
      throw new Error("No generated files provided or empty array.");
    }
    
    // console.log('inside transition', generatedFiles);

    const audio = path.join(__dirname, 'song.mp3');
  
    try {
      for (let i = 0; i < generatedFiles.length; i++) {
        const dataset = generatedFiles[i];
        const images = [{
            path: path.join(__dirname, dataset.image),
            loop: calculateLoopDuration(dataset.duration)
        }];
        // console.log('Updated image', images);
        const outputFileName = `video_${topicId}_${i + 1}.mp4`;
        const subtitles = path.join(__dirname, dataset.captions);
        const inputAudioPath = path.join(__dirname, dataset.audio);
        const outputVideoPath = `final_${topicId}_${i + 1}.mp4`;
  
        await new Promise((resolve, reject) => {
          videoshow(images, {transition: true})
            .audio(audio)
            .save(path.join(__dirname, outputFileName))
            .on('start', command => console.log(`videoshow process started for ${outputFileName}:`))
            .on('error', err => reject(new Error(`Error for videoshow processing ${outputFileName}: ${err}`)))
            .on('end', async () => {
              console.log(`Video created for ${outputFileName} in:`, outputVideoPath);
              try {
                await mergeAudioWithVideo(path.join(__dirname, outputFileName), inputAudioPath, outputVideoPath);
                resolve();
              } catch (error) {
                reject(error);
              }
            });
        });
      }
    } catch (error) {
      console.error("Error creating videos:", error);
      throw error; // Rethrowing the error to handle it further up the call stack if necessary
    }
  }
  


async function mergeAudioWithVideo(inputVideoPath, inputAudioPath, outputVideoPath) {
//   console.log('mergeAudioVideo', inputVideoPath, inputAudioPath, outputVideoPath);
  try {
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputVideoPath)
        .input(inputAudioPath)
        .complexFilter('[0:a][1:a]amix=inputs=2:duration=longest')
        .videoCodec('copy')
        .save(outputVideoPath)
        .on('error', err => reject(new Error(`Error in merging audio and video: ${err}`)))
        .on('end', () => resolve(outputVideoPath));
    });
  } catch (error) {
    console.error("Error in mergeAudioWithVideo:", error);
    throw error;
  }
}


// const topicId = "098ffce8-5802-42ac-91a6-9c6a06b302f3";

// const generatedFiles = [
//     {
//       audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.mp3',        
//       captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.srt',     
//       image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.jpg',
//       duration: 10.9975
//     },
//     {
//       audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.mp3',        
//       captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.srt',     
//       image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.jpg',
//       duration: 2.925688
//     },
//     {
//       audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.mp3',        
//       captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.srt',     
//       image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.jpg',
//       duration: 4.127313
//     },
//     {
//       audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.mp3',        
//       captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.srt',     
//       image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.jpg',
//       duration: 7.183625
//     },
//     {
//       audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.mp3',        
//       captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.srt',     
//       image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_5.jpg',
//       duration: 6.922438
//     }
//   ]

// createVideoWithGeneratedFiles(generatedFiles, topicId)
module.exports = {createVideoWithGeneratedFiles}


