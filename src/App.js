import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";
import debounce from "lodash/debounce"; // Import debounce function from lodash library


// initialize TensorFlow.js backend
await tf.ready();

function App() {
  // references to elements in the Document Object Model (DOM)
  const webcamRef = useRef(null);
  const boundingBoxRef = useRef(null);
  const fileInputRef = useRef(null);

  // state to track input source (webcam or file)
  const [inputSource, setInputSource] = useState("webcam");
  const [selectedImage, setSelectedImage] = useState(null);
  const [accuracyThreshold, setAccuracyThreshold] = useState(-1); // Initial threshold value

  const debouncedHandleThresholdChange = useRef(
    debounce((value) => {
      setAccuracyThreshold(parseFloat(value));
    }, 300) // Adjust debounce delay as needed
  ).current;

  const handleThresholdChange = (event) => {
    console.log("Slider value:", event.target.value); // Log the slider value to the console
    debouncedHandleThresholdChange(event.target.value); // Set the accuracy threshold state
  }; 

  const slider = (
    <div className="slider-container">
      <label className="slider-label"> Accuracy Threshold </label>
      <input
        className="slider"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={accuracyThreshold !== -1 ? accuracyThreshold : 0.5} // Use accuracyThreshold if it's not null, otherwise use default value 0.5
        onChange={handleThresholdChange}
      />
    </div>
  );

 // function to load COCO-SSD model and start object detection
  const runCoco = async () => {
  const net = await cocossd.load(); // load the COCO-SSD model
  console.log("COCO-SSD model loaded.");

  // continuously detect objects in the video stream
  const intervalId = setInterval(() => {
    detectWebcam(net, accuracyThreshold); // call the detect function repeatedly
  }, 10);

  // Return a cleanup function to clear the interval
  return () => clearInterval(intervalId);
  };

  // load COCO-SSD model when component mounts
  useEffect(() => {
    // Check if accuracyThreshold is not -1
    if (accuracyThreshold !== -1) {
      let cleanupFunction;
      runCoco().then(cleanup => {
        cleanupFunction = cleanup;
      });

      // Cleanup function to clear the interval when component unmounts or when accuracyThreshold changes
      return () => {
        if (cleanupFunction) cleanupFunction();
      };
    }
  }, [accuracyThreshold]);

  // function to detect objects in the video stream
  const detectWebcam = async (net, accuracyThreshold) => {
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
      const isMirrored = webcamRef.current.video.style.transform === "scaleX(-1)";

      // Filter detections based on accuracy threshold
      const filteredDetections = obj.filter(prediction => prediction.score >= accuracyThreshold);

      // adjust bounding box coordinates if mirrored
      drawRect(filteredDetections, ctx, videoWidth, videoHeight, isMirrored, accuracyThreshold);
    }
  };

  // state to store the URL of the selected image file
  const [imageUrl, setImageUrl] = useState(null);

  // event handler for changing input source (webcam or file)
  const handleSourceChange = async (event) => {
    const newInputSource = event.target.value;
    setInputSource(newInputSource);

    // reset file input value when switching to image input source
    if (newInputSource === "file") {
      fileInputRef.current.value = null; // reset file input value
      fileInputRef.current.click();
    }

    // if switching back to image file and an image was previously selected, display it
    if (newInputSource !== "webcam" && imageUrl) {
      const img = new Image();
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

        // if switching back to image file, perform detections again
        const net = await cocossd.load();
        const obj = await net.detect(boundingBoxRef.current);
        drawRect(obj, ctx); // draw detections on the canvas
      };

      img.src = imageUrl;
    }
  };

  // event handler for selecting a file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl); // store the URL of the selected image
      setSelectedImage(file.name); // update selected image state
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
    transform: inputSource === "webcam" ? "scaleX(-1)" : "none", // mirror webcam feed horizontally
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
    zIndex: 10,
  };

  
  return (
    <div className="App">
      <header className="App-header">
        {/* dropdown menu for selecting input source */}
        <select
          value={inputSource === "file" ? selectedImage : inputSource}
          onChange={handleSourceChange}
          style={dropdownStyle}
        >
          <option value="webcam">Webcam</option>
          {selectedImage && (
            <option value={selectedImage}>{selectedImage}</option>
          )}
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

        {/* Render the slider */}
        {slider}

        {/* canvas for displaying bounding boxes */}
        <canvas ref={boundingBoxRef} style={boundingBoxStyle} />
      </header>
    </div>
  );
}

export default App;
