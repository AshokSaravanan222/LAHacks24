import React from 'react';
import OpenAI from 'openai';

interface ProgressBarProps {
  progress: number; // Progress value (0 to 100)
  text: string; // Text to display along with the progress bar
}



const ProgressBar: React.FC<ProgressBarProps> = ({ text: string }) => {


    const response = await openai.textTools.textToSpeech({
        text: text,
        speaker: voice, // Specify the voice, e.g., 'texttospeech', 'texttospeech:female' (optional)
      });


  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div className="progress" style={{ width: `${progress}%` }}></div>
      </div>
      <span className="progress-text">{text}</span>
    </div>
  );
};

export default ProgressBar;