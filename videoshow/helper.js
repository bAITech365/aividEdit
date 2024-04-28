const fs = require('fs');
const path = require('path');
const { createClient, srt } = require('@deepgram/sdk');
const deepgram = createClient('a7056d8828505c8de14a6210f133bcdb1efc21f2');

async function generateVoice(text) {
  const fetch = (await import('node-fetch')).default;

  const options = {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': '97e9341b7417e535fdc4acc3c7668437'
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
    const timestamp = new Date().toISOString().replace(/:/g, '-'); // Generate timestamp
    const folderPath = path.join(__dirname, 'audio_and_srt'); // Folder path
    const audioFilePath = path.join(folderPath, `output_${timestamp}.mp3`); // Unique audio filename with timestamp
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/y1adqrqs4jNaANXsIZnD', options);
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    fs.mkdirSync(folderPath, { recursive: true }); // Create the folder if it doesn't exist
    fs.writeFileSync(audioFilePath, data);
    console.log('MP3 file has been saved.');

    const audioData = fs.readFileSync(audioFilePath);
    console.log('Transcribing audio using Deepgram...');  

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      fs.readFileSync(audioFilePath),
      {
        model: "nova-2",
        smart_format: true,
        utterances: true
      },
    );

      if (error) throw error;
      if (!error) 
      {
        const captionsFilePath = path.join(folderPath, `output_${timestamp}.srt`); // Unique captions filename with timestamp
        const stream = fs.createWriteStream(captionsFilePath, { flags: "a" });
        const captions = srt(result, 1); // SRT of 1 word in the file
        console.log('Captions:', captions);
        stream.write(captions);
        stream.end();
        console.log('Captions file has been saved:', captionsFilePath);
      }


  } catch (err) {
    console.error(err);
  }
}

// URL of the audio file you want to transcribe

// Read the audio file




// generateVoice("The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle");

module.exports = {
  generateVoice: generateVoice
};