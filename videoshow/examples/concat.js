const { exec } = require('child_process');
const path = require('path');

function concatenateVideos() {
  // Input video files
  const input1 = path.join(__dirname, '..', '..', 'Nodejs', 'final_1.mp4');
  const input2 = path.join(__dirname, '..', '..', 'Nodejs', 'final_2.mp4');
  const input3 = path.join(__dirname, '..', '..', 'Nodejs', 'final_3.mp4');
  const input4 = path.join(__dirname, '..', '..', 'Nodejs', 'final_4.mp4');
  const input5 = path.join(__dirname, '..', '..', 'Nodejs', 'final_5.mp4');

  // Output video file
  const output = 'concatFile.mp4';

  // Concatenate the input video files using ffmpeg
  const command = `ffmpeg -i ${input1} -i ${input2} -i ${input3} -i ${input4} -i ${input5} -filter_complex concat=n=5:v=1:a=1 -f mp4 -y ${output}`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`ffmpeg stderr: ${stderr}`);
      return;
    }
    console.log(`Video concatenated successfully. Output file: ${output}`);
  });
}

module.exports = concatenateVideos;
