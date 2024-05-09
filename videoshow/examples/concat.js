const { exec } = require('child_process');
const path = require('path');

async function concatenateVideos(topicId) {
    return new Promise((resolve, reject) => {
        const fileIndices = [1, 2, 3, 4, 5];
        // Generate input video filenames dynamically based on topicId and indices
        const inputs = fileIndices.map(index =>
            path.join(__dirname, '..', '..', '/Nodejs', `final_${topicId}_${index}.mp4`)
        );
        // console.log('inputs', inputs);

        // Output video file
        const outputFilePath = path.join(__dirname, '..','..','/Nodejs', `${topicId}_finalVideo.mp4`);

        // Construct the ffmpeg command string dynamically
        const inputCmdPart = inputs.map(input => `-i "${input}"`).join(' ');
        const filterComplex = `concat=n=${inputs.length}:v=1:a=1`;
        const command = `ffmpeg ${inputCmdPart} -filter_complex "${filterComplex}" -f mp4 -y "${outputFilePath}"`;

        // Execute the command
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error in video concat: ${error.message}`);
                reject(error);  // Reject the promise on error
                return;
            }
            // if (stderr) {
            //     // console.error(`ffmpeg stderr: ${stderr}`);
            //     reject(new Error(stderr));  // Treat stderr as an error
            //     return;
            // }
            console.log(`Video concatenated successfully. topicId: ${topicId}`);
            resolve(outputFilePath);  // Resolve the promise with the output path
        });
    });
}

// Usage example
// const topicId = "098ffce8-5802-42ac-91a6-9c6a06b302f3";
// concatenateVideos(topicId)
//     .then(outputFilePath => console.log(`Concatenated video available at: ${outputFilePath}`))
//     .catch(error => console.error(`Failed to concatenate videos: ${error}`));

module.exports = concatenateVideos;
