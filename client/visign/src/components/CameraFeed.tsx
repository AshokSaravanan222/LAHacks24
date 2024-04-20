import React, { useState, useRef, useEffect } from 'react';
import {HolisticLandmarker, FilesetResolver, HolisticLandmarkerResult} from '@mediapipe/tasks-vision';
// import {drawConnectors, drawLandmarks, drawRectangle} from '@mediapipe/drawing_utils';
import {
    HAND_CONNECTIONS,
    POSE_CONNECTIONS,
    FACEMESH_TESSELATION,
    LandmarkConnectionArray,
    NormalizedLandmark
} from '@mediapipe/holistic';

const CameraFeed: React.FC = () => {
    const [showCamera, setShowCamera] = useState<boolean>(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const holisticLandmarkerRef = useRef<HolisticLandmarker | null>(null);
    // const handLandmarkerRef = useRef<HandLandmarker | null>(null);

    const loadModel = async () => {
        console.log('Loading model...');
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        holisticLandmarkerRef.current = await HolisticLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/latest/holistic_landmarker.task`,
                // modelAssetPath: `models/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "IMAGE",
        });
        console.log('Model loaded!');
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

        const draw = (results: any, connection_array: LandmarkConnectionArray) => {
            if (results && results.landmarks.length > 0) {
                console.log('Landmarks detected:', results.landmarks);

                results.landmarks.forEach((landmarks: NormalizedLandmark[]) => {
                    // Draw connections using HAND_CONNECTIONS
                    connection_array.forEach(([start, end]) => {
                        if (!canvasRef.current) {
                            console.error('Canvas not found');
                            return;
                        }

                        const startPoint = landmarks[start];
                        const endPoint = landmarks[end];

                        ctx.beginPath();
                        ctx.moveTo(startPoint.x * canvasRef.current.width, startPoint.y * canvasRef.current.height);
                        ctx.lineTo(endPoint.x * canvasRef.current.width, endPoint.y * canvasRef.current.height);
                        ctx.strokeStyle = '#00FF00';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                    });

                    // Draw each landmark as a circle
                    landmarks.forEach(landmark => {
                        if (!canvasRef.current) {
                            console.error('Canvas not found');
                            return;
                        }

                        ctx.beginPath();
                        ctx.arc(
                            landmark.x * canvasRef.current.width,
                            landmark.y * canvasRef.current.height,
                            3, 0, 2 * Math.PI
                        );
                        ctx.fillStyle = '#FF0000';
                        ctx.fill();
                    });
                });
            }
        }

        draw(holisticResults.leftHandLandmarks, HAND_CONNECTIONS);
        draw(holisticResults.rightHandLandmarks, HAND_CONNECTIONS);
        draw(holisticResults.poseLandmarks, POSE_CONNECTIONS);
        draw(holisticResults.faceLandmarks, FACEMESH_TESSELATION);

        if (showCamera) {
            requestAnimationFrame(predictWebcam);
        }
    };

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
        </div>
    );
}

export default CameraFeed;
