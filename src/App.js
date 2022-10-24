import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Holistic, POSE_CONNECTIONS, HAND_CONNECTIONS } from '@mediapipe/holistic';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Camera } from '@mediapipe/camera_utils';
import { loadLayersModel, tensor2d } from '@tensorflow/tfjs';
import './App.css';

function App() {

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [text, setText] = useState("Loading...");

  useEffect(() => {

    const setModel = async () => { return await loadLayersModel("https://raw.githubusercontent.com/andres-alcala-gtz/sign-language/main/models/javascript/model.json") };

    setModel().then((translator) => {

      const SIGNS = {
        0: "-",
        1: "Hola",
        2: "¿Cómo estás?",
        3: "Bien",
        4: "Mal",
        5: "Con permiso",
        6: "Gracias",
        7: "De nada",
        8: "Por favor",
        9: "Perdón",
        10: "Adiós",
        11: "Cuídate",
        12: "Nos vemos",
        13: "Te quiero"
      };

      const onResults = async (results) => {

        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        let poseLandmarks = Array(3 * 33).fill(-1.0);
        let leftHandLandmarks = Array(3 * 21).fill(-1.0);
        let rightHandLandmarks = Array(3 * 21).fill(-1.0);

        if (results.poseLandmarks) {
          results.poseLandmarks.forEach((item, index) => {
            poseLandmarks[3 * index + 0] = item.x;
            poseLandmarks[3 * index + 1] = item.y;
            poseLandmarks[3 * index + 2] = item.visibility;
          });
        }
        if (results.leftHandLandmarks) {
          results.leftHandLandmarks.forEach((item, index) => {
            leftHandLandmarks[3 * index + 0] = item.x;
            leftHandLandmarks[3 * index + 1] = item.y;
            leftHandLandmarks[3 * index + 2] = item.z;
          });
        }
        if (results.rightHandLandmarks) {
          results.rightHandLandmarks.forEach((item, index) => {
            rightHandLandmarks[3 * index + 0] = item.x;
            rightHandLandmarks[3 * index + 1] = item.y;
            rightHandLandmarks[3 * index + 2] = item.z;
          });
        }

        const detection = translator.predict(tensor2d([[...poseLandmarks, ...leftHandLandmarks, ...rightHandLandmarks]])).flatten().arraySync();
        const argmax = detection.indexOf(Math.max(...detection));
        const prediction = `${detection[argmax].toFixed(2)} <=> ${SIGNS[argmax]}`;

        const canvasCtx = canvasRef.current.getContext("2d");

        canvasCtx.save();

        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#FFFFFF" });
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, { color: "#FFFFFF" });
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, { color: "#FFFFFF" });

        drawLandmarks(canvasCtx, results.poseLandmarks, { color: "#87CEEB" });
        drawLandmarks(canvasCtx, results.leftHandLandmarks, { color: "#87CEEB" });
        drawLandmarks(canvasCtx, results.rightHandLandmarks, { color: "#87CEEB" });

        setText(prediction);

        canvasCtx.restore();

      };

      const holistic = new Holistic({
        locateFile: (file) => { return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}` }
      });
      holistic.onResults(onResults);

      if (typeof webcamRef.current !== "undefined" && webcamRef.current !== null) {
        const camera = new Camera(webcamRef.current.video, {
          onFrame: async () => { await holistic.send({ image: webcamRef.current.video }) },
          width: 640,
          height: 480
        });
        camera.start();
      }

    });

  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam style={{ position: "absolute", marginLeft: "auto", marginRight: "auto", left: 0, right: 0, textAlign: "center", width: 640, height: 480, zIndex: 9 }} ref={webcamRef} muted={true} />
        <canvas style={{ position: "absolute", marginLeft: "auto", marginRight: "auto", left: 0, right: 0, textAlign: "center", width: 640, height: 480, zIndex: 9 }} ref={canvasRef} />
        <p style={{ position: "absolute", marginLeft: "auto", marginRight: "auto", left: 0, right: 0, textAlign: "center", width: 640, height: 480, zIndex: 9 }}>{text}</p>
      </header>
    </div>
  );

}

export default App;
