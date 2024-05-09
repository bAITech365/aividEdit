const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath('C:/ProgramData/chocolatey/bin/ffmpeg');
ffmpeg.setFfprobePath('C:/ProgramData/chocolatey/bin/ffprobe');

const fs = require('fs');
const filePath = 'F:/Projects/nextsolutions/authshort-final/aividEdit/videoshow/examples/input.avi'; // Use the absolute path

fs.access(filePath, fs.constants.R_OK, (err) => {
  console.log(`${filePath} ${err ? 'is not accessible' : 'is accessible'}`);
});

ffmpeg()
  .input(filePath)
  .outputOptions('-c:v libx264')
  .output('output.mp4')
  .on('end', () => console.log('Processing finished'))
  .on('error', (err) => console.log('Error:', err))
  .run();


  const generatedFiles = [
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_0.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.jpg',
      duration: 10.9975
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_1.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.jpg',
      duration: 2.925688
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_2.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.jpg',
      duration: 4.127313
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_3.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.jpg',
      duration: 7.183625
    },
    {
      audio: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.mp3',        
      captions: 'output_098ffce8-5802-42ac-91a6-9c6a06b302f3_4.srt',     
      image: 'image_098ffce8-5802-42ac-91a6-9c6a06b302f3_5.jpg',
      duration: 6.922438
    }
  ]