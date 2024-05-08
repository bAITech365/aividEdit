const fs = require('fs');
const path = require('path');
const { createClient, srt } = require('@deepgram/sdk');
const deepgram = createClient('a7056d8828505c8de14a6210f133bcdb1efc21f2');

async function generateVoice(text, topicId, index) {
    const fetch = (await import('node-fetch')).default;

    const options = {
        method: 'POST',
        headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': 'ca1d85200318925fd4d3937c3db1669c'
        },
        body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
                stability: 1,
                similarity_boost: 1,
                style: 1,
                use_speaker_boost: true
            }
        })
    };

    try {
        const timestamp = `${topicId}_${index}`
        const folderPath = path.join(__dirname, 'examples'); // Folder path
        const audioFileName = `output_${timestamp}.mp3`; // Unique audio filename with timestamp
        const audioFilePath = path.join(folderPath, audioFileName);
        const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/29vD33N1CtxCmqQRPOHJ', options);
        console.log('audioFileName', audioFileName)
        const buffer = await response.arrayBuffer();
        const data = Buffer.from(buffer);
        // fs.mkdirSync(folderPath, { recursive: true }); // Create the folder if it doesn't exist
        fs.writeFileSync(audioFilePath, data);
        console.log('MP3 file has been saved.');

        const audioData = fs.readFileSync(audioFilePath);
        // console.log('Transcribing audio using Deepgram...');

        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
            fs.readFileSync(audioFilePath),
            {
                model: "nova-2",
                smart_format: true,
                utterances: true
            },
        );

        if (error) throw error;

        const captionsFileName = `output_${timestamp}.srt`; // Unique captions filename with timestamp
        const captionsFilePath = path.join(folderPath, captionsFileName);
        const stream = fs.createWriteStream(captionsFilePath, { flags: "a" });
        const captions = srt(result, 1); // SRT of 1 word in the file
        console.log('captionsFileName:', captionsFileName);
        stream.write(captions);
        stream.end();
        // console.log('Captions file has been saved:', captionsFilePath);

        // Return the filenames
        return { audio: audioFileName, captions: captionsFileName };

    } catch (err) {
        console.error(err);
        return { audio: null, captions: null }; // Return null if there's an error
    }
}

module.exports = {
    generateVoice: generateVoice
};
