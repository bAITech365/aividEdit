require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.post('/upload', async (req, res) => {
    try {
        const { token, videoFilePath, videoTitle, videoDescription } = req.body;
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: token });

        const youtube = google.youtube({
            version: 'v3',
            auth: auth
        });

        const res = await youtube.videos.insert({
            part: 'id,snippet,status',
            requestBody: {
                snippet: {
                    title: videoTitle,
                    description: videoDescription,
                    categoryId: '22',  // This is for 'People & Blogs'
                },
                status: {
                    privacyStatus: 'public',  // Can be 'private' or 'unlisted' as well
                }
            },
            media: {
                body: fs.createReadStream(videoFilePath)
            }
        });

        console.log(res.data);
        res.status(200).send('Video uploaded!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to upload the video');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
