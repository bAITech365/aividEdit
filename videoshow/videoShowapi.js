const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const videoshow = require('videoshow');
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to download files
const downloadFile = async (url, filepath) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    let error = null;
    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) {
        resolve(filepath);
      }
    });
  });
};

// POST endpoint to create a video
app.post('/create-video', async (req, res) => {
  const { images, subtitlesUrl, audioUrl } = req.body;
  const downloadedImages = [];
  const subtitlesPath = path.join(__dirname, 'downloads', `subtitles-${Date.now()}.ass`);
  const audioPath = path.join(__dirname, 'downloads', `audio-${Date.now()}.mp3`);

  try {
    // Download subtitle and audio files
    await Promise.all([
      downloadFile(subtitlesUrl, subtitlesPath),
      downloadFile(audioUrl, audioPath)
    ]);

    // Download each image
    for (const image of images) {
      const imagePath = path.join(__dirname, 'downloads', `image-${Date.now()}.png`);
      await downloadFile(image.url, imagePath);
      downloadedImages.push({ path: imagePath, loop: image.loop });
    }

    // Create video
    videoshow(downloadedImages, { transition: true })
      .subtitles(subtitlesPath)
      .audio(audioPath, { loop: true })
      .save('output/video.mp4')
      .on('start', command => {
        // console.log('ffmpeg process started:', command);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('Error:', err);
        res.status(500).send({ message: 'Failed to create video', error: err.message });
      })
      .on('end', output => {
        console.log('Video created in:', output);
        res.send({ message: 'Video created successfully', videoPath: output });
      });
  } catch (error) {
    console.error('Failed to download files or create video:', error);
    res.status(500).send({ message: 'Failed to process request', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
