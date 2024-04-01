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
  // State variable to store the value of output2
  const [output2Value, setOutput2Value] = useState(1); // Initializing with an empty string, assuming it will be updated later
   // Define net as a state variable
   const [net, setNet] = useState(null);

  // state to track input source (webcam or file)
  const [inputSource, setInputSource] = useState("webcam");
  const [selectedImage, setSelectedImage] = useState(null);

  // function to load COCO-SSD model and start object detection
  const runCoco = async () => {
    const loadedNet = await cocossd.load(); // load the COCO-SSD model
    setNet(loadedNet); // Set the loaded model to the net state variable
    console.log("COCO-SSD model loaded.");

    // continuously detect objects in the video stream
    setInterval(() => {
      detectWebcam(net); // call the detect function repeatedly
    }, 10);
  };

 // function to detect objects in the video stream
 const detectWebcam = async (net) => {

  // Check if net is defined before using it
  if (!net) return;
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

    // Get the random limit value from output2Value
    const randomLimit = parseInt(output2Value); // Assuming output2Value contains the random limit value
    console.log("Random Limit:", randomLimit); // Log the random limit

    // Limit the number of objects to the random number
    const limitedObjects = obj.slice(0, randomLimit);

    // draw bounding boxes around detected objects
    const ctx = boundingBoxRef.current.getContext("2d");
    ctx.clearRect(0, 0, videoWidth, videoHeight); // clear the canvas

    // check if webcam feed is mirrored
    const isMirrored = webcamRef.current.video.style.transform === "scaleX(-1)";

    // adjust bounding box coordinates if mirrored
    drawRect(limitedObjects, ctx, videoWidth, videoHeight, isMirrored);
  }
  // Request the next animation frame to continue detecting objects
  requestAnimationFrame(() => detectWebcam(net));
};

 // load COCO-SSD model when component mounts
 
 useEffect(() => {
  runCoco();

  // Add event listener for output2Change event
  const handleOutput2Change = () => {
      setOutput2Value(document.getElementById("value2").innerHTML);
  };

  window.addEventListener("output2Change", handleOutput2Change);

  // Clean up event listener on component unmount
  return () => {
      window.removeEventListener("output2Change", handleOutput2Change);
  };
}, []);

// Update the canvas when output2Value changes
useEffect(() => {
  if (inputSource === "webcam") {
      detectWebcam(net);
  } else {
      detectImage(net, imageUrl);
  }
}, [output2Value]);

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
    ctx.clearRect(0, 0, boundingBoxRef.current.width, boundingBoxRef.current.height);

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

    // Get the random limit value from output2Value
    const randomLimit = parseInt(output2Value); // Assuming output2Value contains the random limit value
    console.log("Random Limit:", randomLimit); // Log the random limit

    // Limit the number of objects to the random number
    const limitedObjects = obj.slice(0, randomLimit);

    drawRect(limitedObjects, ctx); // draw detections on the canvas
  };
};


  // styles
  const webcamStyle = {
    display: inputSource === "webcam" ? "block" : "none",
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    left: 550,
    right: 0,
    top: 50,
    textAlign: "center",
    zIndex: 1,
    width: 640,
    height: 480,
    transform: inputSource === "webcam" ? "  scaleX(-1)" : "none",
  };

  const boundingBoxStyle = {
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    left: 550,
    right: 0,
    top: 50,
    textAlign: "center",
    zIndex: 2,
    width: 640,
    height: 480,
  };
  const dropdownStyle = {
    position: "absolute",
    marginLeft: "auto",
    marginRight: "auto",
    top: 10,
    left: 10,
    zIndex: 3,
    width: 200,
  };

  return (
    <div className="App">
      <header className="App-header">
        {/* dropdown menu for selecting input source */}
        <select
          className="form-select form-select-sm"
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

        {/* canvas for displaying bounding boxes */}
        <canvas ref={boundingBoxRef} style={boundingBoxStyle} />
      </header>
    </div>
  );
}

export default App;