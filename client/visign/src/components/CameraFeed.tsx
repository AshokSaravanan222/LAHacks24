'use-client'
import React, { useState, useRef, useEffect } from 'react';
import { HolisticLandmarker, FilesetResolver, HolisticLandmarkerResult } from '@mediapipe/tasks-vision';
import {
    HAND_CONNECTIONS,
    POSE_CONNECTIONS,
    FACEMESH_TESSELATION,
    LandmarkConnectionArray,
    NormalizedLandmark
} from '@mediapipe/holistic';
import { socket } from '../socket';

// Define the type for a batch of landmarks
type LandmarkBatch = NormalizedLandmark[][];

const CameraFeed: React.FC = () => {
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const holisticLandmarkerRef = useRef<HolisticLandmarker | null>(null);
    const [landmarkCounter, setLandmarkCounter] = useState(0);
    // Initialize landmarksBatch with the correct type
    const [landmarksBatch, setLandmarksBatch] = useState<LandmarkBatch>([]);
    const [message, setMessage] = useState(''); // State to store the response
    const framesToSend = 10; // Number of frames to send in a batch
    const [geminiText, setGeminiText] = useState('');

    const processLandmarks = (results: HolisticLandmarkerResult) => {
        const allLandmarks = [
            ...(results.faceLandmarks.length !== 0 ? results.faceLandmarks[0].slice(0, 468) : Array(468).fill(null)),
            ...(results.leftHandLandmarks.length !== 0 ? results.leftHandLandmarks[0] : Array(21).fill(null)),
            ...(results.poseLandmarks.length !== 0 ? results.poseLandmarks[0] : Array(33).fill(null)),
            ...(results.rightHandLandmarks.length !== 0 ? results.rightHandLandmarks[0] : Array(21).fill(null)),
        ];
        
        // Step 1: Initialize placeholders for axis checks
        const xValues = allLandmarks.map(landmark => landmark ? landmark.x : null);
        const yValues = allLandmarks.map(landmark => landmark ? landmark.y : null);
        const zValues = allLandmarks.map(landmark => landmark ? landmark.z : null);
        
        // Step 2: Determine if all values are null for each axis
        const allXNull = xValues.every(value => value === null);
        const allYNull = yValues.every(value => value === null);
        const allZNull = zValues.every(value => value === null);
        
        // Step 3: Map landmarks to the final structure with null checks
        const landmarksXYZ = allLandmarks.map(landmark => ({
            x: allXNull ? null : (landmark && landmark.x !== undefined ? landmark.x : null),
            y: allYNull ? null : (landmark && landmark.y !== undefined ? landmark.y : null),
            z: allZNull ? null : (landmark && landmark.z !== undefined ? landmark.z : null) 
        }));

        
        setLandmarksBatch((prev: LandmarkBatch) => {
            const newBatch = [...prev, landmarksXYZ];
            if (prev.length === (framesToSend - 1)) { // Check if the new batch will be the 10th one
                socket.emit('landmark', JSON.stringify(newBatch[0])); // Send the batch to the server
                setLandmarkCounter(0); // Reset counter
                return []; // Clear the batch
            }
            return newBatch; // Otherwise, just update the batch
        });
    };
    
    

    const loadModel = async () => {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
        );
        holisticLandmarkerRef.current = await HolisticLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task`,
                // modelAssetPath: `models/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "IMAGE",
        });
    };

    const startCamera = async () => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current!.srcObject = stream;
                videoRef.current!.onloadeddata = async () => {
                    console.log("Video data loaded");
                    if (videoRef.current!.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                        await loadModel();
                        requestAnimationFrame(predictWebcam);
                    }
                };
            } catch (error) {
                console.error('Error accessing the camera: ', error);
            }
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const predictWebcam = async () => {
        if (!holisticLandmarkerRef.current || !videoRef.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) {
            console.error('Failed to get canvas context');
            return;
        }

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        
        const holisticResults = await holisticLandmarkerRef.current.detect(videoRef.current);
        processLandmarks(holisticResults);
        
        const draw = (results: NormalizedLandmark[][], connection_array: LandmarkConnectionArray) => {
            if (results && results.length > 0) {
                results.forEach((landmarkGroup: NormalizedLandmark[]) => {
                    // Draw connections using connection_array
                    connection_array.forEach(([start, end]) => {
                        if (!canvasRef.current) {
                            console.error('Canvas not found');
                            return;
                        }
        
                        const startPoint = landmarkGroup[start];
                        const endPoint = landmarkGroup[end];
        
                        ctx.beginPath();
                        ctx.moveTo(startPoint.x * canvasRef.current.width, startPoint.y * canvasRef.current.height);
                        ctx.lineTo(endPoint.x * canvasRef.current.width, endPoint.y * canvasRef.current.height);
                        ctx.strokeStyle = '#00FF00';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    });
        
                    // Draw each landmark as a circle
                    landmarkGroup.forEach(landmark => {
                        if (!canvasRef.current) {
                            console.error('Canvas not found');
                            return;
                        }
        
                        ctx.beginPath();
                        ctx.arc(
                            landmark.x * canvasRef.current.width,
                            landmark.y * canvasRef.current.height,
                            1, 0, 2 * Math.PI
                        );
                        ctx.fillStyle = '#FF0000';
                        ctx.fill();
                    });
                });
            }
        };

        draw(holisticResults.leftHandLandmarks, HAND_CONNECTIONS);
        draw(holisticResults.rightHandLandmarks, HAND_CONNECTIONS);
        draw(holisticResults.poseLandmarks, POSE_CONNECTIONS);
        // draw(holisticResults.faceLandmarks, FACEMESH_TESSELATION);

        if (showCamera) {
            requestAnimationFrame(predictWebcam);
        }
    };

    useEffect(() => {
        // Handler for 'output' event
        const handleOutput = (data: any) => {
            console.log('Received data:', data);
            setMessage(data.message); // Update the message state
        };
    
        // Handler for 'gemini' event
        const handleGemini = (data: any) => {
            console.log('Received gemini data:', data);
            setGeminiText(data.message); // Update the geminiText state
        };
    
        // Setting up the listeners
        socket.on('output', handleOutput);
        socket.on('gemini', handleGemini);
    
        // Cleanup function to remove the listeners
        return () => {
            socket.off('output', handleOutput);
            socket.off('gemini', handleGemini);
        };
    }, [socket]);

    useEffect(() => {
        if (showCamera) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => stopCamera();
    }, [showCamera]);

    return (
        <div className="flex flex-col items-center p-4 relative">
            <button onClick={() => setShowCamera(!showCamera)}
                    className="mb-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-400 transition shadow">
                {showCamera ? 'Hide Camera' : 'Show Camera'}
            </button>
            {showCamera && (
                <div className="relative w-full max-w-lg transition">
                    <video ref={videoRef} autoPlay playsInline className="w-full rounded shadow-lg" />
                    <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ width: '100%', height: '100%' }} />
                </div>
            )}
            <text>{geminiText}</text>
        </div>
    );
}

export default CameraFeed;
