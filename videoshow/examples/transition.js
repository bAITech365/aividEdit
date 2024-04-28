var videoshow = require('../');
const ffmpeg = require('fluent-ffmpeg');


var audio = __dirname + '/../test/fixtures/song.mp3'

var images = [
  {
    path: __dirname + '/../test/fixtures/step_1.png',
    loop: 10,
    subtitle: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-14.739Z.srt',
    audio: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-14.739Z.mp3'
  }, {
    path: __dirname + '/../test/fixtures/step_2.png',
    loop: 15,
    subtitle: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-25.424Z.srt',
    audio: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-25.424Z.mp3'
  }, {
    path: __dirname + '/../test/fixtures/step_3.png',
    // transitionColor: '0xFF66C7'
    subtitle: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-32.602Z.srt',
    audio: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-32.602Z.mp3'
  }, {
    path: __dirname + '/../test/fixtures/step_4.png',
    // transition: false,
    // transitionColor: 'red'
    subtitle: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-43.660Z.srt',
    audio: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-43.660Z.mp3'
  }, {
    path: __dirname + '/../test/fixtures/step_5.png',
    // transition: false
    subtitle: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-51.571Z.srt',
    audio: __dirname + '/../audio_and_srt/output_2024-04-28T11-27-51.571Z.mp3'
  }
];

videoshow(images, { transition: true })
  .subtitles(images.map(image => image.subtitle)) // Pass an array of subtitle paths
  .audio(audio)      // Pass an array of audio paths
  .save('video.mp4')
  .on('start', function (command) {
    console.log('ffmpeg process started:', command);
  })
  .on('error', function (err) {
    console.error('Error:', err);
  })
  .on('end', function (output) {
    console.log('Video created in:', output);

    // Merge all speaking audio files into one
    var audioFiles = images.map(image => image.audio);
    mergeAudioFiles(audioFiles, function() {
      console.log('Processing finished !');
    });
  });

  function mergeAndSyncAudio(files, callback) {
    var ffmpegCommand = ffmpeg();
  
    // Add inputs for all audio files and map them to separate audio streams
    files.forEach(function(file, index) {
      ffmpegCommand.input(file).inputOptions(`-itsoffset ${index * 10}`); // Adjust offset based on image duration
    });
  
    // Use amix filter to mix the audio streams
    ffmpegCommand
      .complexFilter(`[0:a]${files.map((_, index) => `[${index}:a]`).join('')}amix=inputs=${files.length}:duration=first`)
      .videoCodec('copy') // Copy the video stream to avoid re-encoding
      .save('output.mp4')
      .on('error', function(err) {
        console.log('Error: ' + err.message);
      })
      .on('end', function() {
        callback();
      });
  
}



// var videoshow = require('../')
// const ffmpeg = require('fluent-ffmpeg');


// var audio = __dirname + '/../test/fixtures/song.mp3'
// var subtitles = __dirname + '/../test/fixtures/subtitles.srt'

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
