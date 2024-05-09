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
   
    // Define the audio path and subtitles
    if (!generatedFiles || generatedFiles.length === 0) {
        console.error("No generated files provided or empty array.");
        return;  // Exit if no files to process
    }
    
console.log('inside transition', generatedFiles)
const audio = path.join(__dirname, 'song.mp3');

const promises = [];

// Iterate over each dataset in generatedFiles
for (let i = 0; i < generatedFiles.length; i++) {
    const dataset = generatedFiles[i];
    // console.log('dataset', dataset)
    const images = [{
        path: path.join(__dirname, dataset.image),
        loop: calculateLoopDuration(dataset.duration)
    }];
    console.log('updated image', images)// Create an array with the current image
    const outputFileName = `video_${topicId}_${i + 1}.mp4`;

    // Use the path specified in the caption property as the subtitle path
    const subtitles = path.join(__dirname, dataset.captions);
    const inputAudioPath = path.join(__dirname, dataset.audio);
    console.log('input audio path', inputAudioPath)
    const outputVideoPath = `final_${topicId}_${i + 1}.mp4`;

    // Define options for videoshow
    const options = {
        transition: true
    };

    videoshow(images, options)
    // .subtitles(subtitles)
    .audio(audio)
    .save(outputFileName)
    .on('start', function (command) {
        console.log(`vidooshow process started for ${outputFileName}:`, command);
    })
    .on('error', function (err) {
        console.error(`Error for videoshow processing ${outputFileName}:`, err);
        // reject(err);
    })
    .on('end', function (output) {
        console.log(`Video created for ${outputFileName} in:`, output);
        // Merge audio with video after video creation
        const inputVideoPath = path.join(__dirname, '..',  outputFileName);
        console.log('inside videoshow. on input video file path', inputVideoPath)
        mergeAudioWithVideo(inputVideoPath, inputAudioPath, outputVideoPath)
            .then(outputPath => {
                console.log('Merged video saved at:', outputPath);
                // resolve();
            })
            .catch(error => {
                console.error('Error merging audio with video:', error);
                // reject(error);
            });
    });

   
}

}


async function mergeAudioWithVideo(inputVideoPath, inputAudioPath, outputVideoPath) {
    console.log('mergeAudioVideo', inputVideoPath, inputAudioPath, outputVideoPath)
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(inputVideoPath)
            .input(inputAudioPath)
            .complexFilter('[0:a][1:a]amix=inputs=2:duration=longest')
            .videoCodec('copy')
            .save(outputVideoPath)
            .on('error', function(err) {
                reject(err);
            })
            .on('end', function() {
                resolve(outputVideoPath);
            });
    });
}



// createVideoWithGeneratedFiles(generatedFiles, topicId)
module.exports = {createVideoWithGeneratedFiles}


