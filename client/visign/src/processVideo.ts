import {Holistic, POSE_CONNECTIONS} from '@mediapipe/holistic';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

export const processVideo = async (videoRef: any, canvasRef: any) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const holistic = new Holistic({locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        }});

    holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        refineFaceLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    holistic.onResults((results) => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00FF00', lineWidth: 4});
        drawLandmarks(ctx, results.poseLandmarks, {color: '#FF0000', lineWidth: 2});
        // Draw other landmarks similarly
    });

    const sendFrameToHolistic = () => {
        if (video.paused || video.ended) {
            return;
        }
        const frame = new ImageData(new Uint8ClampedArray(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data), canvas.width, canvas.height);
        holistic.send({image: frame});
        requestAnimationFrame(sendFrameToHolistic);
    };

    video.play().then(() => {
        sendFrameToHolistic();
    });
};
