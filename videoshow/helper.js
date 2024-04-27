const fs = require('fs');

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
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/y1adqrqs4jNaANXsIZnD', options);
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);
    fs.writeFileSync('output.mp3', data);
    console.log('MP3 file has been saved.');
  } catch (err) {
    console.error(err);
  }
}

generateVoice('This script loads the video and audio files, applies the audio mixing filter, and saves the output without re-encoding the video.');
