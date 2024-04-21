import React, { useState, useEffect } from 'react';
import { OpenAI } from 'openai'; // Assuming OpenAI SDK is imported like this

interface AudioPlayerProps {
  progress: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ progress: string }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      try {
        const client = new OpenAI(); // Initialize OpenAI client
        const response = await client.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: `Progress is at ${progress}%.`,
        });
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
      } catch (error) {
        console.error('Error fetching audio:', error);
      }
    };

    fetchAudio();

    // Clean up the audio URL when component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [progress]);

  return (
    <div>
      <p>Progress: {progress}%</p>
      {audioUrl && <audio controls src={audioUrl} />}
    </div>
  );
};

export default AudioPlayer;
