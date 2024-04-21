import {
    FACEMESH_TESSELATION,
    HAND_CONNECTIONS,
    LandmarkConnectionArray,
    NormalizedLandmark,
    POSE_CONNECTIONS
} from "@mediapipe/holistic";
import {HolisticLandmarkerResult} from "@mediapipe/tasks-vision";

function drawLandmarks(ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[][], connections: LandmarkConnectionArray, shouldRender: boolean) {
    if (!landmarks || !shouldRender || landmarks.length === 0) return;

    const widthScale = ctx.canvas.width;
    const heightScale = ctx.canvas.height;

    // Prepare paths for all connections first
    ctx.beginPath();
    connections.forEach(([start, end]) => {
        landmarks.forEach((landmarkGroup) => {
            const startPoint = landmarkGroup[start];
            const endPoint = landmarkGroup[end];
            ctx.moveTo(startPoint.x * widthScale, startPoint.y * heightScale);
            ctx.lineTo(endPoint.x * widthScale, endPoint.y * heightScale);
        });
    });
    ctx.stroke(); // Execute all line drawing in one go

    // Then draw all landmarks
    landmarks.forEach((landmarkGroup) => {
        landmarkGroup.forEach(landmark => {
            ctx.beginPath();
            ctx.arc(
                landmark.x * widthScale,
                landmark.y * heightScale,
                1, 0, 2 * Math.PI
            );
            ctx.fill();
        });
    });
}

export function drawAllLandmarks(ctx: CanvasRenderingContext2D, holisticResults: HolisticLandmarkerResult, showFace: boolean, showBody: boolean, showHands: boolean) {
    ctx.fillStyle = 'rgb(0,0,0)';

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgb(208,255,0)';
    drawLandmarks(ctx, holisticResults.leftHandLandmarks, HAND_CONNECTIONS, showHands);
    drawLandmarks(ctx, holisticResults.rightHandLandmarks, HAND_CONNECTIONS, showHands);

    ctx.strokeStyle = 'rgb(198,54,255)';
    drawLandmarks(ctx, holisticResults.poseLandmarks, POSE_CONNECTIONS.slice(9), showBody);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(141,234,246,0.15)';
    ctx.fillStyle = 'rgba(141,234,146,0.20)';
    drawLandmarks(ctx, holisticResults.faceLandmarks, FACEMESH_TESSELATION, showFace);
}