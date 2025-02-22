import React, { useEffect, useRef, useState } from "react";
import * as handpose from "@tensorflow-models/handpose";

const HandTracker = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const runHandTracking = async () => {
      const model = await handpose.load();
      console.log("HandPose model loaded!");

      const video = videoRef.current;
      await setupCamera(video);

      setInterval(async () => {
        const predictions = await model.estimateHands(video);
        if (predictions.length > 0) {
          drawHand(predictions);
          detectGestures(predictions[0].landmarks);
        }
      }, 200);
    };

    runHandTracking();
  }, []);

  const setupCamera = async (video) => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });
  };

  const drawHand = (predictions) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (predictions.length > 0) {
      const keypoints = predictions[0].landmarks;
      ctx.fillStyle = "red";

      for (let i = 0; i < keypoints.length; i++) {
        const [x, y] = keypoints[i];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  const detectGestures = (landmarks) => {
    if (!landmarks) return;

    const [thumb, index, middle, ring, pinky] = [
      landmarks[4],
      landmarks[8],
      landmarks[12],
      landmarks[16],
      landmarks[20],
    ];

    // Detect swipe left/right
    const palmCenterX = (landmarks[0][0] + landmarks[9][0]) / 2;
    if (palmCenterX < 100) {
      console.log("Swipe Left - Navigating Back");
      window.history.back();
    } else if (palmCenterX > window.innerWidth - 100) {
      console.log("Swipe Right - Navigating Forward");
      window.history.forward();
    }

    // Detect pinch zoom
    const pinchDistance = Math.sqrt(
      Math.pow(index[0] - thumb[0], 2) + Math.pow(index[1] - thumb[1], 2)
    );
    if (pinchDistance < 40) {
      setZoomLevel((prev) => Math.max(0.5, prev - 0.1));
      console.log("Zooming Out!", zoomLevel);
    }
    if (pinchDistance > 100) {
      setZoomLevel((prev) => Math.min(2, prev + 0.1));
      console.log("Zooming In!", zoomLevel);
    }

    // Detect fist (mouse click)
    const avgDistance =
      Math.abs(index[1] - middle[1]) +
      Math.abs(middle[1] - ring[1]) +
      Math.abs(ring[1] - pinky[1]);
    if (avgDistance < 30) {
      console.log("Fist Detected - Clicking the button!");
      document.getElementById("gestureButton").click();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <video ref={videoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} width={640} height={480} style={{ position: "absolute", top: 0, left: 0 }} />

      {/* Test UI Elements */}
      <button
        id="gestureButton"
        onClick={() => alert("Gesture Click Detected!")}
        style={{
          padding: "10px 20px",
          fontSize: "18px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        Click Me (Gesture)
      </button>

      <div
        style={{
          width: "300px",
          height: "150px",
          fontSize: `${zoomLevel}em`,
          border: "2px solid black",
          margin: "auto",
          padding: "20px",
          transition: "font-size 0.2s ease",
        }}
      >
        Pinch to Zoom Me!
      </div>
    </div>
  );
};

export default HandTracker;
