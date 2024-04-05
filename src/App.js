import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
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

  return (
    <div class="container">
      <div class="dropdown">
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
      <div class="slider1">
        <label for="customRange1" class="form-label">
          Max Detections
        </label>
        <input type="range" class="form-range" id="customRange1" />
      </div>
      <div class="slider2">
        <label for="customRange1" class="form-label">
          Score Threshold
        </label>
        <input type="range" class="form-range" id="customRange1" />
      </div>
      <div class="webcam">
        {inputSource === "webcam" && (
          <Webcam ref={webcamRef} muted={true} className="webcam-image" />
        )}
        <canvas ref={boundingBoxRef} />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </div>

    // FROM SKELETON 2 -> dropdown, slider 1, slider 2, canvas
    // <div class="container text-center">
    //   <div class="row">
    //     <div class="col-md-3">
    //       <h2></h2>
    //       <br></br>
    //       <p></p>
    //     </div>
    //     <div class="col-md-6 ms-auto">
    //       <select
    //         className="form-select"
    //         value={inputSource === "file" ? selectedImage : inputSource}
    //         onChange={handleSourceChange}
    //       >
    //         <option value="webcam">Webcam</option>
    //         {selectedImage && (
    //           <option value={selectedImage}>{selectedImage}</option>
    //         )}
    //         <option value="file">Choose an image file...</option>
    //       </select>
    //     </div>
    //   </div>
    //   <div class="row">
    //     <div class="col-md-3">
    //       <br></br>
    //       <br></br>
    //       <br></br>
    //       <br></br>
    //       <br></br>
    //       <br></br>
    //       <label for="customRange1" class="form-label">
    //         Max Detections
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //       <br></br>
    //       <br></br>
    //       <br></br>
    //       <label for="customRange1" class="form-label">
    //         Score Threshold
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //     </div>
    //     <div class="col-md-6 ms-auto">
    //       <div
    //         style={{
    //           height: inputSource === "webcam" ? "480px" : "500px",
    //           overflow: "hidden",
    //         }}
    //       >
    //         {inputSource === "webcam" && (
    //           <Webcam
    //             ref={webcamRef}
    //             muted={true}
    //             className="webcam-container"
    //           />
    //         )}
    //       </div>
    //       <canvas ref={boundingBoxRef} className="bounding-box-container" />
    //     </div>
    //   </div>
    //   <div class="row">
    //     <div class="col-md-3">
    //       <label for="customRange1" class="form-label">
    //         Max Detections
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //       <br></br>
    //       <label for="customRange1" class="form-label">
    //         Max Detections 2
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //     </div>
    //   </div>
    //   <div class="row">
    //     <div class="col-md-3">
    //       <label for="customRange1" class="form-label">
    //         Score Threshold
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //     </div>
    //   </div>

    //   <input
    //     type="file"
    //     ref={fileInputRef}
    //     onChange={handleFileChange}
    //     style={{ display: "none" }}
    //   />
    // </div>

    // FROM SKELETON 1 -> dropdown, canvas, slider 1, slider 2
    // <div class="container text-center">
    //   <div class="row">
    //     <div class="col-md-6 ms-auto">
    //       {/* <label className="dropdown-label">Input</label> */}
    //       <select
    //         className="form-select"
    //         value={inputSource === "file" ? selectedImage : inputSource}
    //         onChange={handleSourceChange}
    //       >
    //         <option value="webcam">Webcam</option>
    //         {selectedImage && (
    //           <option value={selectedImage}>{selectedImage}</option>
    //         )}
    //         <option value="file">Choose an image file...</option>
    //       </select>
    //     </div>
    //   </div>
    //   <div class="row">
    //     <div class="col-md-6 ms-auto">
    //       {inputSource === "webcam" && (
    //         <Webcam ref={webcamRef} muted={true} className="webcam-container" />
    //       )}
    //       <canvas ref={boundingBoxRef} className="bounding-box-container" />
    //     </div>
    //   </div>
    //   <div class="row">
    //     <div class="col-md-3 md-auto">
    //       <label for="customRange1" class="form-label">
    //         Max Detections
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //     </div>
    //   </div>
    //   <div class="row">
    //     <div class="col-md-3 md-auto">
    //       <label for="customRange1" class="form-label">
    //         Score Threshold
    //       </label>
    //       <input type="range" class="form-range" id="customRange1" />
    //     </div>
    //   </div>

    //   <input
    //     type="file"
    //     ref={fileInputRef}
    //     onChange={handleFileChange}
    //     style={{ display: "none" }}
    //   />
    // </div>
  );

  // STARTING SKELETON 2
  // <div class="container text-center">
  //     <div class="row">
  //       <div class="col-md-3 ms-md-auto">DROPDOWN</div>
  //     </div>

  //     <div class="row">
  //       <div class="col-md-3">.col-md-3 .ms-md-auto</div>
  //     </div>

  //     <div class="row">
  //       <div class="col-md-3">.col-md-3 .ms-md-auto</div>
  //     </div>

  //     <div class="row">
  //       <div class="col-md-3 ms-md-auto">WEBCAM</div>
  //     </div>
  //   </div>

  // STARTING SKELETON 1
  // return (
  //   <div class="container text-center">
  //     <div class="row">
  //       <div class="col-md-3 ms-auto">DROPDOWN</div>
  //     </div>
  //     <div class="row">
  //       <div class="col-md-3 ms-auto">WEBCAM</div>
  //     </div>
  //     <div class="row">
  //       <div class="col-md-3 md-auto">SLIDER 1</div>
  //     </div>
  //     <div class="row">
  //       <div class="col-md-3 md-auto">SLIDER 2</div>
  //     </div>
  //   </div>
  // );

  // INITIAL CODE
  // return (
  //   <div className="container">
  //     <div className="App-dropdown">
  //       {/* dropdown menu for selecting input source */}
  //       <label className="dropdown-label">Input</label>
  //       <select
  //         className="form-select"
  //         value={inputSource === "file" ? selectedImage : inputSource}
  //         onChange={handleSourceChange}
  //       >
  //         <option value="webcam">Webcam</option>
  //         {selectedImage && (
  //           <option value={selectedImage}>{selectedImage}</option>
  //         )}
  //         <option value="file">Choose an image file...</option>
  //       </select>
  //     </div>

  //     <div className="App-webcam">
  //       {/* render webcam component if input source is webcam */}
  //       {inputSource === "webcam" && (
  //         <Webcam ref={webcamRef} muted={true} className="webcam-container" />
  //       )}
  //     </div>
  //     <div className="App-bounding-box">
  //       {/* canvas for displaying bounding boxes */}
  //       <canvas ref={boundingBoxRef} className="bounding-box-container" />
  //     </div>

  //     {/* hidden input field for selecting a file from the system */}
  //     <input
  //       type="file"
  //       ref={fileInputRef}
  //       onChange={handleFileChange}
  //       style={{ display: "none" }}
  //     />
  //   </div>
  // );
}

export default App;
