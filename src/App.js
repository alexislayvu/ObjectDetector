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

  // state to store uploaded images and their URLs
  const [uploadedImages, setUploadedImages] = useState([]);

  // state to track if the component has been initialized
  const [initialized, setInitialized] = useState(false);

  // state to store the score threshold
  const [scoreThreshold, setScoreThreshold] = useState(0.5);

  // state to track if scoreThreshold has changed from its initial value
  const [thresholdChanged, setThresholdChanged] = useState(false);

  // state to store the maximum number of detections
  const [maxDetections, setMaxDetections] = useState(1);

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

  useEffect(() => {
    // check if initialized and scoreThreshold is not 0.5 or if threshold has changed
    if ((initialized && scoreThreshold !== 0.5) || thresholdChanged) {
      let cleanupFunction;
      runCoco().then((cleanup) => {
        cleanupFunction = cleanup;
      });

      // cleanup function to clear the interval when component unmounts or when scoreThreshold or maxDetections changes
      return () => {
        if (cleanupFunction) cleanupFunction();
      };
    } else {
      setInitialized(true); // set initialized to true after the first render
      setThresholdChanged(true); // set thresholdChanged to true after the initial render
    }
  }, [initialized, scoreThreshold, maxDetections, thresholdChanged]);

  // event handler for selecting a file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      const imageName = file.name;

      // check if the uploaded image already exists in uploadedImages
      const imageExists = uploadedImages.some(
        (image) => image.name === imageName
      );

      if (!imageExists) {
        const newImage = { name: imageName, url: imageUrl };
        setUploadedImages([...uploadedImages, newImage]); // add new image to the list
        setSelectedImage(newImage); // update selected image state
        const net = await cocossd.load();
        detectImage(net, imageUrl, scoreThreshold, maxDetections);
      } else {
        // update selectedImage state to the uploaded image
        const selectedImageObj = uploadedImages.find(
          (image) => image.name === imageName
        );
        if (selectedImageObj) {
          setSelectedImage(selectedImageObj);
          const net = await cocossd.load();
          detectImage(net, selectedImageObj.url, scoreThreshold, maxDetections);
        }
        console.log(`Image '${imageName}' already exists.`);
      }
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

    // if switching back to an uploaded image
    if (newInputSource !== "webcam" && newInputSource !== "file") {
      // find the selected image object from the uploadedImages array
      const selectedImageObj = uploadedImages.find(
        (image) => image.name === newInputSource
      );

      if (selectedImageObj) {
        // update selectedImage state to the selected image
        setSelectedImage(selectedImageObj);
        // update imageUrl state to the selected image URL
        setImageUrl(selectedImageObj.url);

        // perform detections again
        const net = await cocossd.load();
        detectImage(net, selectedImageObj.url, scoreThreshold, maxDetections);
      }
    }
  };

  // debounce the handleThresholdChange function
  const debouncedHandleThresholdChange = useRef(
    debounce((value) => {
      setScoreThreshold(parseFloat(value));
      // trigger object detection with the updated score threshold and max detections value
      if (selectedImage && inputSource !== "webcam") {
        Promise.resolve().then(async () => {
          const net = await cocossd.load();
          detectImage(net, selectedImage.url, parseFloat(value), maxDetections);
        });
      }
    }, 300) // adjust debounce delay as needed
  ).current;

  // event handler for changing score threshold
  const handleThresholdChange = async (event) => {
    const newScoreThreshold = parseFloat(event.target.value);
    console.log("New Score Threshold Value:", newScoreThreshold); // debug statement
    debouncedHandleThresholdChange(newScoreThreshold);

    // trigger object detection with the updated score threshold and max detections value
    if (selectedImage && inputSource !== "webcam") {
      Promise.resolve().then(async () => {
        const net = await cocossd.load();
        detectImage(net, selectedImage.url, newScoreThreshold, maxDetections);
      });
    }
  };

  const debouncedHandleMaxDetectionsChange = useRef(
    debounce((value) => {
      setMaxDetections(parseInt(value));
    }, 300) // adjust debounce delay as needed
  ).current;

  // function to update the maxDetections state and trigger object detection
  const handleMaxDetectionsChange = async (event) => {
    const newMaxDetections = parseInt(event.target.value);
    console.log("New Max Detections Value:", newMaxDetections); // debug statement
    debouncedHandleMaxDetectionsChange(parseInt(event.target.value));

    // trigger object detection with the updated score threshold and max detections value
    if (selectedImage && inputSource !== "webcam") {
      Promise.resolve().then(async () => {
        const net = await cocossd.load();
        detectImage(net, selectedImage.url, scoreThreshold, newMaxDetections);
      });
    }
  };

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
        (prediction) =>
          Math.round(prediction.score * 100) >= Math.round(scoreThreshold * 100)
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
        .filter(
          (prediction) =>
            Math.round(prediction.score * 100) >=
            Math.round(scoreThreshold * 100)
        )
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
          value={
            inputSource === "file" && selectedImage
              ? selectedImage.name
              : inputSource
          }
          onChange={handleSourceChange}
        >
          <option value="webcam">Webcam</option>
          {uploadedImages.map((image, index) => (
            <option key={index} value={image.name}>
              {image.name}
            </option>
          ))}
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
