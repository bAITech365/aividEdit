const { exec } = require('child_process');
const path = require('path');

async function concatenateVideos(topicId) {
  fileIndices = [1, 2, 3, 4, 5]
    // Generate input video filenames dynamically based on topicId and indices
    const inputs = fileIndices.map(index =>
      path.join(__dirname, '..', `final_${topicId}_${index}.mp4`)
    );
  console.log('inputs', inputs)
  // Input video files
  // const input1 = path.join(__dirname, '..', '..', 'Nodejs', 'final_1.mp4');
  // const input2 = path.join(__dirname, '..', '..', 'Nodejs', 'final_2.mp4');
  // const input3 = path.join(__dirname, '..', '..', 'Nodejs', 'final_3.mp4');
  // const input4 = path.join(__dirname, '..', '..', 'Nodejs', 'final_4.mp4');
  // const input5 = path.join(__dirname, '..', '..', 'Nodejs', 'final_5.mp4');

  // Output video file
  const output = `${topicId}_finalVideo.mp4`; 
  // const output = 'concatFile.mp4';


   // Construct the ffmpeg command string dynamically
   const inputCmdPart = inputs.map(input => `-i "${input}"`).join(' ');
   const filterComplex = `concat=n=${inputs.length}:v=1:a=1`;
   const command = `ffmpeg ${inputCmdPart} -filter_complex "${filterComplex}" -f mp4 -y "${output}"`;
 console.log('inputCmdPart', inputCmdPart)
 console.log('filterComplex', filterComplex)
 console.log('command', command)
  // Concatenate the input video files using ffmpeg
  // const command = `ffmpeg -i ${input1} -i ${input2} -i ${input3} -i ${input4} -i ${input5} -filter_complex concat=n=5:v=1:a=1 -f mp4 -y ${output}`;

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if(stdout){
      console.log(`Video concatenated successfully. Output file: ${output}`);
    }
    if (error) {
      console.error(`Error in video concat: ${error.message}`);
      return;
    }
    if (stderr) {
      // console.error(`ffmpeg stderr: ${stderr}`);
      return;
    }
  });
}
// const topicId = "098ffce8-5802-42ac-91a6-9c6a06b302f3";
// concatenateVideos(topicId)
module.exports = concatenateVideos;
