'use-client'
import React, { useState, useRef, useEffect } from 'react';
import { processVideo } from '@/processVideo';

const VideoProcessor = () => {
    const [videoURL, setVideoURL] = useState('');
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const handleFileChange = event => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoURL(url);
        }
    };

    useEffect(() => {
        if (videoURL !== '') {
            processVideo(videoRef, canvasRef);
        }
    }, [videoURL]);

    return (
        <div>
            <input type="file" accept="video/*" onChange={handleFileChange} />
            <video ref={videoRef} src={videoURL} style={{ display: 'none' }} />
            <canvas ref={canvasRef} />
        </div>
    );
};

export default VideoProcessor;
