var videoshow = require('../')
const ffmpeg = require('fluent-ffmpeg');


var audio = __dirname + '/../test/fixtures/song.mp3'
var subtitles = __dirname + '/../test/fixtures/subtitles.srt'

var options = {
  transition: true
}

var images = [
  {
    path: __dirname + '/../test/fixtures/step_1.png',
    loop: 10
  }, {
    path: __dirname + '/../test/fixtures/step_2.png',
    loop: 15
  }, {
    path: __dirname + '/../test/fixtures/step_3.png',
    // transitionColor: '0xFF66C7'
  }, {
    path: __dirname + '/../test/fixtures/step_4.png',
    // transition: false,
    // transitionColor: 'red'
  }, {
    path: __dirname + '/../test/fixtures/step_5.png',
    // transition: false
  }
]

videoshow(images, options)
  .subtitles(subtitles)
  .audio(audio)
  .save('video.mp4')
  .on('start', function (command) {
    console.log('ffmpeg process started:', command)
  })
  .on('error', function (err) {
    console.error('Error:', err)
  })
  .on('end', function (output) {
    console.log('Video created in:', output);

ffmpeg()
.input(__dirname + '/../video.mp4')
.input(__dirname + '/../speaking.mp3')
.complexFilter([
  '[0:a][1:a]amix=inputs=2:duration=longest'
])
.videoCodec('copy') // Copy the video stream to avoid re-encoding
.save('output.mp4')
.on('error', function(err) {
  console.log('Error: ' + err.message);
})
.on('end', function() {
  console.log('Processing finished !');
});
  })
