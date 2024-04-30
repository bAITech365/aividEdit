var videoshow = require('../')
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;

async function createVideoWithGeneratedFiles(generatedFiles) {
    // Define the audio path and subtitles
// console.log(generatedFiles)
const audio = path.join(__dirname, 'song.mp3');

const promises = [];

// Iterate over each dataset in generatedFiles
for (let i = 0; i < generatedFiles.length; i++) {
    const dataset = generatedFiles[i];
    console.log('dataset', dataset)
    const images = [path.join(__dirname, dataset.image)]; 
    // console.log(images)// Create an array with the current image
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
// ffmpeg.setFfmpegPath(ffmpegPath);
// ffmpeg.setFfprobePath(ffprobePath);

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


// async function createVideoWithGeneratedFiles(generatedFiles) {
//     // Define the audio path and subtitles
//     const audio = path.join(__dirname, 'song.mp3');
//     const subtitles = path.join(__dirname, '..', 'test', 'fixtures', 'subtitles.ass');
//     const outputDir = path.join(__dirname, '/');
// console.log(generatedFiles)
//   // Iterate over each item in the generatedFiles array
// //   const filesWithPath = generatedFiles.map(async file => {
// //     // Create the full path for each file
// //     const audioPath = path.join(outputDir, file.audio);
// //     const captionsPath = path.join(outputDir, file.captions);
// //     const imagePath = path.join(outputDir, file.image);

// //     // Return an object with the file name and its corresponding path
// //     return {
// //         audio: { name: file.audio, path: audioPath, duration: await getAudioDuration(audioPath) },
// //         captions: { name: file.captions, path: captionsPath },
// //         image: { name: file.image, path: imagePath, loop: Math.floor(await getAudioDuration(audioPath))},
// //     };
// // });

// // // Resolve all promises and log the files with their paths and durations

// // const resolvedFiles = await Promise.all(filesWithPath);
// // // console.log('Files with paths and durations:', resolvedFiles);

// // // Calculate the total duration of all audio files
// // const totalDuration = resolvedFiles.reduce((total, file) => total + file.audio.duration, 0);
// // console.log('Total duration of all audio files:', totalDuration);


// // Create an array to hold the transformed data
// const transformedImages = [];

// // const promiseFiles = await Promise.all(filesWithPath);
// // console.log('Files with paths and durations:', promiseFiles);

// // Iterate over each item in resolvedFiles array
// // promiseFiles.forEach(file => {
// //     // console.log('File:', file); // Log the contents of the file object
// //     // Push an object representing each image to the transformedImages array
// //     transformedImages.push({
// //         path: file.image.path, // Path to the image file
// //         loop: file.image.loop // Loop count for the image
// //     });
// // });
// // console.log(transformedImages)
//     // Define the options for videoshow
//     const options = {
//         transition: true
//     };
// // console.log(filesWithPath)
// const sub1= '/workspace/aividEdit/videoshow/examples/output_2024-04-29T07-15-49.035Z.srt'
// const sub2 = '/workspace/aividEdit/videoshow/examples/output_2024-04-29T07-15-52.227Z.srt'
//  const files = [sub1, sub2, sub1, sub2, sub1].join('|')

// // Create a new instance of videoshow
// // const video = videoshow(transformedImages, options);

// // // Loop through each file in filesWithPath array
// // resolvedFiles.forEach(file => {
// //     // Add the subtitle to the videoshow
// //     console.log(file.captions.path)
// //     video.subtitles(file.captions.path); // Add subtitle for the current file
// // });

// // Then continue with other operations or event handling
// // For example, saving the video
// // video
// //     .save('video2.mp4')
// //     .on('start', function (command) {
// //         console.log('ffmpeg process started:', command);
// //     })
// //     .on('error', function (err, stdout, stderr) {
// //         console.error('Error:', err);
// //         console.error('ffmpeg stderr:', stderr);
// //     })
// //     .on('end', function (output) {
// //         console.log('Video created in:', output);
// //     });

//     // videoshow(transformedImages, options)
//     //     .subtitles(files)
       
//     //     // .subtitles(sub2)
//     // //     .audio(audio)
//     //     .save('video1.mp4')
//     //     .on('start', function (command) {
//     //         console.log('ffmpeg process started:', command);
//     //     })
//     //     .on('error', function (err) {
//     //         console.error('Error:', err);
//     //     })
//     //     .on('end', function (output) {
//     //         console.log('Video created in:', output);
//     //     })
//     // //         // Call ffmpeg to add speaking audio to the video
//     //         ffmpeg()
//     //             .input(path.join(__dirname, '..', 'video.mp4'))
//     //             .input(path.join(__dirname, '..', 'speaking.mp3'))
//     //             .complexFilter([
//     //                 '[0:a][1:a]amix=inputs=2:duration=longest'
//     //             ])
//     //             .videoCodec('copy') // Copy the video stream to avoid re-encoding
//     //             .save('output.mp4')
//     //             .on('error', function(err) {
//     //                 console.log('Error: ' + err.message);
//     //             })
//     //             .on('end', function() {
//     //                 console.log('Processing finished !');
//     //             });
//     //     });
// }

module.exports = {createVideoWithGeneratedFiles}



// var audio = __dirname + '/song.mp3'
// var subtitles = __dirname + '/../test/fixtures/subtitles.ass'

// var options = {
//   transition: true
// }

// var images = [
//   {
//     path: __dirname + '/../test/fixtures/step_1.png',
//     loop: 10
//   }, {
//     path: __dirname + '/../test/fixtures/step_2.png',
//     loop: 15
//   }, {
//     path: __dirname + '/../test/fixtures/step_3.png',
//     // transitionColor: '0xFF66C7'
//   }, {
//     path: __dirname + '/../test/fixtures/step_4.png',
//     // transition: false,
//     // transitionColor: 'red'
//   }, {
//     path: __dirname + '/../test/fixtures/step_5.png',
//     // transition: false
//   }
// ]

// videoshow(images, options)
//   .subtitles(subtitles)
//   .audio(audio)
//   .save('video.mp4')
//   .on('start', function (command) {
//     console.log('ffmpeg process started:', command)
//   })
//   .on('error', function (err) {
//     console.error('Error:', err)
//   })
//   .on('end', function (output) {
//     console.log('Video created in:', output);

// ffmpeg()
// .input(__dirname + '/../video.mp4')
// .input(__dirname + '/../speaking.mp3')
// .complexFilter([
//   '[0:a][1:a]amix=inputs=2:duration=longest'
// ])
// .videoCodec('copy') // Copy the video stream to avoid re-encoding
// .save('output.mp4')
// .on('error', function(err) {
//   console.log('Error: ' + err.message);
// })
// .on('end', function() {
//   console.log('Processing finished !');
// });
//   })