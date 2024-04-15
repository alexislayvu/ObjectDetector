import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import debounce from "lodash/debounce";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { drawRect } from "./utilities";
import "./App.css";

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

  // state to store the URL of the selected image file
  const [imageUrl, setImageUrl] = useState(null);

  // state to store the score threshold
  const [scoreThreshold, setScoreThreshold] = useState(-1);

  // state to store the maximum number of detections
  const [maxDetections, setMaxDetections] = useState(1);

  useEffect(() => {
    if (scoreThreshold !== -1) {
      let cleanupFunction;
      runCoco().then((cleanup) => {
        cleanupFunction = cleanup;
      });

      // cleanup function to clear the interval when component unmounts or when scoreThreshold or maxDetections changes
      return () => {
        if (cleanupFunction) cleanupFunction();
      };
    }
  }, [scoreThreshold, maxDetections]);

  // function to load the COCO-SSD model and start object detection on the webcam feed
  const runCoco = async () => {
    const net = await cocossd.load(); // load the COCO-SSD model
    console.log("COCO-SSD model loaded.");

    // continuously detect objects in the video stream
    const intervalId = setInterval(() => {
      detectWebcam(net, scoreThreshold, maxDetections); // call the detect function repeatedly
    }, 10);

    // return a cleanup function to clear the interval
    return () => clearInterval(intervalId);
  };

  // event handler for selecting a file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImageUrl(imageUrl); // store the URL of the selected image
      setSelectedImage(file.name); // update selected image state
      const net = await cocossd.load();
      detectImage(net, imageUrl, scoreThreshold, maxDetections);
    }
  };

  // event handler for changing input source (webcam or file)
  const handleSourceChange = async (event) => {
    const newInputSource = event.target.value;
    setInputSource(newInputSource);

    // clear canvas when switching to webcam input
    if (newInputSource === "webcam") {
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
        detectImage(net, imageUrl, scoreThreshold, maxDetections);
      };

      img.src = imageUrl;
    }
  };

  // function to update the scoreThreshold state and trigger object detection
  const handleThresholdChange = (event) => {
    const newScoreThreshold = parseFloat(event.target.value);
    console.log("New Score Threshold Value:", newScoreThreshold); // debug statement
    debouncedHandleThresholdChange(parseFloat(event.target.value));

    // trigger object detection with the updated score threshold and max detections value
    if (inputSource !== "webcam" && imageUrl) {
      cocossd.load().then((net) => {
        detectImage(net, imageUrl, newScoreThreshold, maxDetections);
      });
    }
  };

  const debouncedHandleThresholdChange = useRef(
    debounce((value) => {
      setScoreThreshold(parseFloat(value));
    }, 100) // adjust debounce delay as needed
  ).current;

  // function to update the maxDetections state and trigger object detection
  const handleMaxDetectionsChange = async (event) => {
    const newMaxDetections = parseInt(event.target.value);
    console.log("New Max Detections Value:", newMaxDetections); // debug statement
    debouncedHandleMaxDetectionsChange(parseInt(event.target.value));

    // trigger object detection with the updated score threshold and max detections value
    if (inputSource !== "webcam" && imageUrl) {
      const net = await cocossd.load();
      detectImage(net, imageUrl, scoreThreshold, newMaxDetections);
    }
  };

  const debouncedHandleMaxDetectionsChange = useRef(
    debounce((value) => {
      setMaxDetections(value);
    }, 100) // adjust debounce delay as needed
  ).current;

  // function to detect objects in the video stream
  const detectWebcam = async (net, scoreThreshold, maxDetections) => {
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

      // filter detections based on scoreThreshold
      const filteredDetections = obj.filter(
        (prediction) => prediction.score >= scoreThreshold
      );

      // draw rectangles around filtered detections
      drawRect(
        filteredDetections.slice(0, maxDetections),
        ctx,
        videoWidth,
        videoHeight,
        isMirrored
      );
    }
  };

  // function to detect objects in an image file
  const detectImage = async (net, imageFile, scoreThreshold, maxDetections) => {
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

      // filter detections based on scoreThreshold and maxDetections
      const filteredDetections = obj
        .filter((prediction) => prediction.score >= scoreThreshold)
        .slice(0, maxDetections);

      // draw rectangles around filtered detections
      drawRect(filteredDetections, ctx);
    };
  };

  return (
    <div className="container">
      <div className="dropdown">
        <label className="dropdown-label">Input</label>
        <select
          className="form-select"
          value={inputSource === "file" ? selectedImage : inputSource}
          onChange={handleSourceChange}
        >
          <option value="webcam">Webcam</option>
          {selectedImage && (
            <option value={selectedImage}>{selectedImage}</option>
          )}
          <option value="file">Choose an image file...</option>
        </select>
      </div>

      <div className="max_detections_slider">
        <label htmlFor="customRange1" className="form-label">
          Max Detections
        </label>
        <input
          type="range"
          className="form-range"
          id="customRange1"
          min="0"
          max="10"
          defaultValue={1}
          onChange={handleMaxDetectionsChange}
        />
        <p>
          Value: <span id="max_detections_value">{maxDetections}</span>
        </p>
      </div>

      <div className="score_threshold_slider">
        <label htmlFor="customRange2" className="form-label">
          Score Threshold
        </label>
        <input
          type="range"
          className="form-range"
          id="customRange2"
          min="0"
          max="1"
          step="0.01"
          defaultValue={0.5}
          onChange={handleThresholdChange}
        />
        <p>
          Value:{" "}
          <span id="score_threshold_value">
            {(scoreThreshold * 100).toFixed(0)}%
          </span>
        </p>
      </div>

      <div className="webcam">
        {inputSource === "webcam" && (
          <Webcam ref={webcamRef} muted={true} className="webcam-feed" />
        )}
        <canvas
          ref={boundingBoxRef}
          className={
            inputSource === "webcam" ? "webcam-canvas" : "image-canvas"
          }
        />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}

export default App;
