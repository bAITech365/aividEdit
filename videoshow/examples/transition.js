var videoshow = require('../')
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);



console.log("ffmpeg path:", ffmpegPath);
console.log("ffprobe path:", ffprobePath);

function calculateLoopDuration(audioDuration) {
    // Assuming a loop duration of 10 seconds for every 1 second of audio
    return Math.ceil(audioDuration);
}

async function createVideoWithGeneratedFiles(generatedFiles) {
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
    console.log(images)// Create an array with the current image
    const outputFileName = `video_${i + 1}.mp4`; // Use a sequential number for the output file name

    // Use the path specified in the caption property as the subtitle path
    const subtitles = path.join(__dirname, dataset.captions);
    const inputAudioPath = path.join(__dirname, dataset.audio);
    const outputVideoPath = `final_${i+1}.mp4`
    // Define options for videoshow
    const options = {
        transition: true
    };

    // Create the video using videoshow
    const promise = await new Promise((resolve, reject) => {
        videoshow(images, options)
            .subtitles(subtitles)
            .audio(audio)
            .save(outputFileName)
            .on('start', function (command) {
                console.log(`ffmpeg process started for ${outputFileName}:`, command);
            })
            .on('error', function (err) {
                console.error(`Error for ${outputFileName}:`, err);
                reject(err);
            })
            .on('end', function (output) {
                console.log(`Video created for ${outputFileName} in:`, output);
                // Merge audio with video after video creation
                const inputVideoPath = path.join(__dirname, '..', '..', 'Nodejs',  outputFileName);
                console.log(inputVideoPath)
                mergeAudioWithVideo(inputVideoPath, inputAudioPath, outputVideoPath)
                    .then(outputPath => {
                        console.log('Merged video saved at:', outputPath);
                        resolve();
                    })
                    .catch(error => {
                        console.error('Error merging audio with video:', error);
                        reject(error);
                    });
            });
    });
    promises.push(promise);
    // Delay for 1 second between each video creation
    // await new Promise(resolve => setTimeout(resolve, 1000));
}
return Promise.all(promises);
}


async function mergeAudioWithVideo(inputVideoPath, inputAudioPath, outputVideoPath) {
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


// calculating audio duration
async function getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                const duration = metadata.format.duration;
                // console.log('Audio duration:', duration); // Log the duration
                resolve(duration);
            }
        });
    });
}



module.exports = {createVideoWithGeneratedFiles}


