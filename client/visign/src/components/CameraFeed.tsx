'use-client'
import React, { useState, useRef, useEffect } from 'react';
import { HolisticLandmarker, FilesetResolver, HolisticLandmarkerResult } from '@mediapipe/tasks-vision';
import {
    NormalizedLandmark
} from '@mediapipe/holistic';
import { socket } from '@/socket';
import { drawAllLandmarks } from '@/drawing_utils';

const CameraFeed: React.FC = () => {
    const [enableCamera, setEnableCamera] = useState<boolean>(false);
    const [showHands, setShowHands] = useState(true);
    const [showBody, setShowBody] = useState(true);
    const [showFace, setShowFace] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const holisticLandmarkerRef = useRef<HolisticLandmarker | null>(null);
    const [landmarkCounter, setLandmarkCounter] = useState(0);
    // Initialize landmarksBatch with the correct type
    const [landmarksBatch, setLandmarksBatch] = useState<NormalizedLandmark[][]>([]);
    const [message, setMessage] = useState(''); // State to store the response
    const framesToSend = 10; // Number of frames to send in a batch

    const processLandmarks = (results: HolisticLandmarkerResult, setLandmarksBatch: Function) => {
        const allLandmarks = [
            ...(results.leftHandLandmarks.length !== 0 ? results.leftHandLandmarks[0] : Array(21).fill(null)),
            ...(results.rightHandLandmarks.length !== 0 ? results.rightHandLandmarks[0] : Array(21).fill(null)),
            ...(results.poseLandmarks.length !== 0 ? results.poseLandmarks[0] : Array(33).fill(null)),
            ...(results.faceLandmarks.length !== 0 ? results.faceLandmarks[0].slice(0, 468) : Array(468).fill(null)),
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

        setLandmarksBatch((prev: NormalizedLandmark[][]) => {
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
        const holisticResults = holisticLandmarkerRef.current.detect(videoRef.current);
        processLandmarks(holisticResults, setLandmarksBatch);
        drawAllLandmarks(ctx, holisticResults, showFace, showBody, showHands);
        if (enableCamera) {
            requestAnimationFrame(predictWebcam);
        }
    };

    useEffect(() => {
        // Setting up the listener for the 'response' event
        socket.on('output', (data: any) => {
            console.log('Received data:', data);
            setMessage(data.message); // Assuming 'data.message' is the part of the server response you want to use
        });

        // Cleanup function to remove the listener
        return () => {
            socket.off('output');
        };
    }, []);

    useEffect(() => {
        if (enableCamera) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [enableCamera]);

    return (
        <div className="flex flex-col items-center p-4 relative">
            <div className="mb-4">
                <button onClick={() => setEnableCamera(!enableCamera)}
                        className="mb-4 px-4 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-400 transition shadow">
                    {enableCamera ? 'Disable Camera' : 'Enable Camera'}
                </button>
            </div>
            {enableCamera &&
                (
                    <>
                        <div className="flex mb-4 text-white font-light">
                            <label className="inline-flex items-center px-2">
                                <input type="checkbox" checked={showHands} onChange={e => setShowHands(e.target.checked)} />
                                <span className="ml-2">Hands</span>
                            </label>
                            <label className="inline-flex items-center px-2">
                                <input type="checkbox" checked={showBody} onChange={e => setShowBody(e.target.checked)} />
                                <span className="ml-2">Body</span>
                            </label>
                            <label className="inline-flex items-center px-2">
                                <input type="checkbox" checked={showFace} onChange={e => setShowFace(e.target.checked)} />
                                <span className="ml-2">Face</span>
                            </label>
                        </div>
                        <div className="relative w-full max-w-lg transition">
                            <video ref={videoRef} autoPlay playsInline className="w-full rounded shadow-lg" />
                            <canvas ref={canvasRef} className="absolute top-0 left-0" style={{ width: '100%', height: '100%' }} />
                        </div>
                    </>
                )
            }
        </div>
    );
}

export default CameraFeed;
