import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";

// initialize TensorFlow.js backend
await tf.ready();

function App() {
  // references to elements in the Document Object Model (DOM)
  const webcamRef = useRef(null);
  const boundingBoxRef = useRef(null);
  const fileInputRef = useRef(null);

  // state to track input source (webcam or file)
  const [inputSource, setInputSource] = useState("webcam");

  // function to load COCO-SSD model and start object detection
  const runCoco = async () => {
    const net = await cocossd.load(); // load the COCO-SSD model
    console.log("COCO-SSD model loaded.");

    // continuously detect objects in the video stream
    setInterval(() => {
      detectWebcam(net); // call the detect function repeatedly
    }, 10);
  };

  // function to detect objects in the video stream
  const detectWebcam = async (net) => {
    // check if webcam video data is available
    if (
      webcamRef.current &&
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // get video properties
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      // set canvas dimensions to match video dimensions
      video.width = videoWidth;
      video.height = videoHeight;
      boundingBoxRef.current.width = videoWidth;
      boundingBoxRef.current.height = videoHeight;

      // make object detections
      const obj = await net.detect(video);

      // draw bounding boxes around detected objects
      const ctx = boundingBoxRef.current.getContext("2d");
      ctx.clearRect(0, 0, videoWidth, videoHeight); // clear the canvas

      // check if webcam feed is mirrored
      const isMirrored =
        webcamRef.current.video.style.transform === "scaleX(-1)";

      // adjust bounding box coordinates if mirrored
      drawRect(obj, ctx, videoWidth, videoHeight, isMirrored);
    }
  };

  // load COCO-SSD model when component mounts
  useEffect(() => {
    runCoco();
  }, []);

  // event handler for changing input source (webcam or file)
  const handleSourceChange = async (event) => {
    const newInputSource = event.target.value;
    setInputSource(newInputSource);

    // clear bounding box canvas when switching input source
    if (newInputSource !== "webcam" && boundingBoxRef.current) {
      const ctx = boundingBoxRef.current.getContext("2d");
      ctx.clearRect(
        0,
        0,
        boundingBoxRef.current.width,
        boundingBoxRef.current.height
      );
    }

    // reset file input value when switching to image input source
    if (newInputSource === "file") {
      fileInputRef.current.value = null; // reset file input value
      fileInputRef.current.click();
    }

    // reset webcam transformation
    if (
      newInputSource === "webcam" &&
      webcamRef.current &&
      webcamRef.current.video
    ) {
      webcamRef.current.video.style.transform = "none";
    }
  };

  // event handler for selecting a file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const net = await cocossd.load();
      detectImage(net, imageUrl);
    }
  };

  // function to detect objects in an image file
  const detectImage = async (net, imageFile) => {
    const img = document.createElement("img");
    img.src = imageFile;
    img.onload = async () => {
      const ctx = boundingBoxRef.current.getContext("2d");

      // clear the canvas
      ctx.clearRect(
        0,
        0,
        boundingBoxRef.current.width,
        boundingBoxRef.current.height
      );

      // calculate scaling factors to fit the image within the canvas
      const scaleFactor = Math.min(
        boundingBoxRef.current.width / img.width,
        boundingBoxRef.current.height / img.height
      );

      // calculate scaled dimensions
      const scaledWidth = img.width * scaleFactor;
      const scaledHeight = img.height * scaleFactor;

      // calculate position to center the image
      const x = (boundingBoxRef.current.width - scaledWidth) / 2;
      const y = (boundingBoxRef.current.height - scaledHeight) / 2;

      // draw the image on the canvas
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

      // detect objects in the image
      const obj = await net.detect(boundingBoxRef.current);
      drawRect(obj, ctx); // draw detections on the canvas
    };
  };

  // styles
  const webcamStyle = {
    display: inputSource === "webcam" ? "block" : "none",
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 1,
    width: 640,
    height: 480,
    transform: inputSource === "webcam" ? "scaleX(-1)" : "none", // Mirror webcam feed horizontally
  };

  const boundingBoxStyle = {
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    left: 0,
    right: 0,
    textAlign: "center",
    zIndex: 2,
    width: 640,
    height: 480,
  };

  const dropdownStyle = {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 3,
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* dropdown menu for selecting input source */}
        <select
          value={inputSource}
          onChange={handleSourceChange}
          style={dropdownStyle}
        >
          <option value="webcam">Webcam</option>
          <option value="file">Choose an image file...</option>
        </select>

        {/* hidden input field for selecting a file from the system */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {/* render webcam component if input source is webcam */}
        {inputSource === "webcam" && (
          <Webcam ref={webcamRef} muted={true} style={webcamStyle} />
        )}

        {/* canvas for displaying bounding boxes */}
        <canvas ref={boundingBoxRef} style={boundingBoxStyle} />
      </header>
    </div>
  );
}

export default App;
