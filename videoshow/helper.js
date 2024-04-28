const fs = require('fs');
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
     const filePath = 'output.mp3';
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/y1adqrqs4jNaANXsIZnD', options);
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    fs.writeFileSync(filePath, data);
    console.log('MP3 file has been saved.');

    const audioData = fs.readFileSync(filePath);
    console.log('deepgram');   

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        fs.readFileSync(filePath),
        {
          model: "nova-2",
          smart_format: true,
          utterances: true
        },
      );

      if (error) throw error;
      if (!error) 
      {
         const stream = fs.createWriteStream("output.srt", { flags: "a" });
         const captions = srt(result,1); //srt of 1 word in the file
         console.log(captions);
         stream.write(captions);
         stream.end();
      }


  } catch (err) {
    console.error(err);
  }
}

// URL of the audio file you want to transcribe

// Read the audio file




// generateVoice('This script loads the video and audio files, applies the audio mixing filter, and saves the output without re-encoding the video.');

module.exports = {
  generateVoice: generateVoice
};