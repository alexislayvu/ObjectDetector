import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import debounce from "lodash/debounce";
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

  const [scoreThreshold, setScoreThreshold] = useState(-1);

  // Function to handle selecting an image from the dropdown menu
  const handleImageSelect = async (imageUrl) => {
    setImageUrl(imageUrl); // Set the URL of the selected image
    setSelectedImage(imageUrl); // Update selected image state
    if (imageUrl) {
      const net = await cocossd.load();
      detectImage(net, imageUrl, scoreThreshold); // Trigger object detection with current score threshold
    }
  };

  // Modified handleThresholdChange function to update the scoreThreshold state and trigger object detection
  const handleThresholdChange = (event) => {
    const newScoreThreshold = parseFloat(event.target.value);
    setScoreThreshold(newScoreThreshold);

    // Trigger object detection with the updated threshold value
    if (imageUrl) {
      cocossd.load().then((net) => {
        detectImage(net, imageUrl, newScoreThreshold);
      });
    }
  };

  // Modified handleFileChange function to trigger object detection after selecting an image file
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      handleImageSelect(imageUrl); // Call handleImageSelect to trigger object detection
    }
  };

  // Modified handleSourceChange function to trigger object detection when switching to an image input source
  const handleSourceChange = async (event) => {
    const newInputSource = event.target.value;
    setInputSource(newInputSource);

    // Reset file input value when switching to image input source
    if (newInputSource === "file") {
      fileInputRef.current.value = null; // Reset file input value
      fileInputRef.current.click();
    }

    // Trigger object detection when switching to an image file
    if (newInputSource !== "webcam" && imageUrl) {
      handleImageSelect(imageUrl);
    }
  };

  // does not work with no reupload.
  // Modify handleThresholdChange function to update the scoreThreshold state
  // const handleThresholdChange = (event) => {
  //   const newScoreThreshold = parseFloat(event.target.value);
  //   setScoreThreshold(newScoreThreshold);

  //   // Trigger object detection with the updated threshold value
  //   if (inputSource === "file" && imageUrl) {
  //     debouncedLoadModelAndDetect(imageUrl, newScoreThreshold); // Call the debounced function
  //   }
  // };

  // Debounced function to load the model and perform object detection
  const debouncedLoadModelAndDetect = useRef(
    debounce(async (imageUrl, scoreThreshold) => {
      const net = await cocossd.load();
      detectImage(net, imageUrl, scoreThreshold);
    }, 300) // Adjust debounce delay as needed
  ).current;

  // function to load COCO-SSD model and start object detection
  const runCoco = async () => {
    const net = await cocossd.load(); // load the COCO-SSD model
    console.log("COCO-SSD model loaded.");

    // continuously detect objects in the video stream
    const intervalId = setInterval(() => {
      detectWebcam(net, scoreThreshold); // call the detect function repeatedly
    }, 10);

    // Return a cleanup function to clear the interval
    return () => clearInterval(intervalId);
  };

  // function to detect objects in the video stream
  const detectWebcam = async (net, scoreThreshold) => {
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

      // Filter detections based on scoreThreshold
      const filteredDetections = obj.filter(
        (prediction) => prediction.score >= scoreThreshold
      );

      // adjust bounding box coordinates if mirrored
      drawRect(filteredDetections, ctx, videoWidth, videoHeight, isMirrored);
    }
  };

  // load COCO-SSD model when component mounts
  useEffect(() => {
    // Check if scoreThreshold is not -1
    if (scoreThreshold !== -1) {
      let cleanupFunction;
      runCoco().then((cleanup) => {
        cleanupFunction = cleanup;
      });

      // Cleanup function to clear the interval when component unmounts or when scoreThreshold changes
      return () => {
        if (cleanupFunction) cleanupFunction();
      };
    }
  }, [scoreThreshold]);

  // event handler for changing input source (webcam or file)
  // const handleSourceChange = async (event) => {
  //   const newInputSource = event.target.value;
  //   setInputSource(newInputSource);

  //   // reset file input value when switching to image input source
  //   if (newInputSource === "file") {
  //     fileInputRef.current.value = null; // reset file input value
  //     fileInputRef.current.click();
  //   }

  //   // if switching back to image file and an image was previously selected, display it
  //   if (newInputSource !== "webcam" && imageUrl) {
  //     const img = new Image();
  //     img.onload = async () => {
  //       const ctx = boundingBoxRef.current.getContext("2d");

  //       // clear the canvas
  //       ctx.clearRect(
  //         0,
  //         0,
  //         boundingBoxRef.current.width,
  //         boundingBoxRef.current.height
  //       );

  //       // calculate scaling factors to fit the image within the canvas
  //       const scaleFactor = Math.min(
  //         boundingBoxRef.current.width / img.width,
  //         boundingBoxRef.current.height / img.height
  //       );

  //       // calculate scaled dimensions
  //       const scaledWidth = img.width * scaleFactor;
  //       const scaledHeight = img.height * scaleFactor;

  //       // calculate position to center the image
  //       const x = (boundingBoxRef.current.width - scaledWidth) / 2;
  //       const y = (boundingBoxRef.current.height - scaledHeight) / 2;

  //       // draw the image on the canvas
  //       ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  //       // if switching back to image file, perform detections again
  //       const net = await cocossd.load();
  //       const obj = await net.detect(boundingBoxRef.current);

  //       drawRect(obj, ctx); // draw detections on the canvas
  //     };

  //     img.src = imageUrl;
  //   }
  // };

  // event handler for selecting a file
  // const handleFileChange = async (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const imageUrl = URL.createObjectURL(file);
  //     setImageUrl(imageUrl); // store the URL of the selected image
  //     setSelectedImage(file.name); // update selected image state
  //     const net = await cocossd.load();
  //     detectImage(net, imageUrl, scoreThreshold); // Pass scoreThreshold to detectImage
  //   }
  // };

  const detectImage = async (net, imageFile, scoreThreshold) => {
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

      // Log detected objects
      console.log("Detected objects:", obj);

      // Filter detections based on scoreThreshold
      const filteredDetections = obj.filter(
        (prediction) => prediction.score >= scoreThreshold
      );

      // draw detections on the canvas with scoreThreshold
      drawRect(filteredDetections, ctx);
    };
  };

  // const detectImage = async (net, imageFile, accuracyThreshold) => {
  //   const img = document.createElement("img");
  //   img.src = imageFile;
  //   img.onload = async () => {
  //     const ctx = boundingBoxRef.current.getContext("2d");

  //     // clear the canvas
  //     ctx.clearRect(
  //       0,
  //       0,
  //       boundingBoxRef.current.width,
  //       boundingBoxRef.current.height
  //     );

  //     // calculate scaling factors to fit the image within the canvas
  //     const scaleFactor = Math.min(
  //       boundingBoxRef.current.width / img.width,
  //       boundingBoxRef.current.height / img.height
  //     );

  //     // calculate scaled dimensions
  //     const scaledWidth = img.width * scaleFactor;
  //     const scaledHeight = img.height * scaleFactor;

  //     // calculate position to center the image
  //     const x = (boundingBoxRef.current.width - scaledWidth) / 2;
  //     const y = (boundingBoxRef.current.height - scaledHeight) / 2;

  //     // draw the image on the canvas
  //     ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  //     // detect objects in the image
  //     const obj = await net.detect(boundingBoxRef.current);

  //     // Log detected objects
  //     console.log("Detected objects:", obj);

  //     // draw detections on the canvas with accuracy threshold
  //     drawRect(obj, ctx, accuracyThreshold);
  //   };
  // };

  // function to detect objects in an image file
  // const detectImage = async (net, imageFile) => {
  //   const img = document.createElement("img");
  //   img.src = imageFile;
  //   img.onload = async () => {
  //     const ctx = boundingBoxRef.current.getContext("2d");

  //     // clear the canvas
  //     ctx.clearRect(
  //       0,
  //       0,
  //       boundingBoxRef.current.width,
  //       boundingBoxRef.current.height
  //     );

  //     // calculate scaling factors to fit the image within the canvas
  //     const scaleFactor = Math.min(
  //       boundingBoxRef.current.width / img.width,
  //       boundingBoxRef.current.height / img.height
  //     );

  //     // calculate scaled dimensions
  //     const scaledWidth = img.width * scaleFactor;
  //     const scaledHeight = img.height * scaleFactor;

  //     // calculate position to center the image
  //     const x = (boundingBoxRef.current.width - scaledWidth) / 2;
  //     const y = (boundingBoxRef.current.height - scaledHeight) / 2;

  //     // draw the image on the canvas
  //     ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

  //     // detect objects in the image
  //     const obj = await net.detect(boundingBoxRef.current);
  //     drawRect(obj, ctx); // draw detections on the canvas
  //   };
  // };

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

      <div className="md_slider">
        <label htmlFor="customRange1" className="form-label">
          Max Detections
        </label>
        <input type="range" className="form-range" id="customRange1" />
      </div>

      <div className="st_slider">
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
          value={scoreThreshold !== -1 ? scoreThreshold : 0.5}
          onChange={handleThresholdChange}
        />
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

// initial
// const debouncedHandleThresholdChange = useRef(
//   debounce((value) => {
//     setScoreThreshold(parseFloat(value));
//   }, 50) // Adjust debounce delay as needed
// ).current;
// const handleThresholdChange = (event) => {
//   console.log("Slider value:", event.target.value);
//   debouncedHandleThresholdChange(event.target.value);
// };
// Function to load the model and perform object detection
// const loadModelAndDetect = async (imageUrl, scoreThreshold) => {
//   const net = await cocossd.load();
//   detectImage(net, imageUrl, scoreThreshold);
// };

// new
// Modify handleThresholdChange function to update the scoreThreshold state
// const handleThresholdChange = (event) => {
//   const newScoreThreshold = parseFloat(event.target.value);
//   setScoreThreshold(newScoreThreshold);
//   // Trigger object detection with the updated threshold value
//   if (inputSource === "file" && imageUrl) {
//     loadModelAndDetect(imageUrl, newScoreThreshold); // Call the async function
//   }
// };

// App.js code (Apr. 8)
// import React, { useRef, useState, useEffect } from "react";
// import * as tf from "@tensorflow/tfjs";
// import Webcam from "react-webcam";
// import * as cocossd from "@tensorflow-models/coco-ssd";
// import { drawRect } from "./utilities";
// import "./App.css";

// // initialize TensorFlow.js backend
// await tf.ready();

// function App() {
//   // references to elements in the Document Object Model (DOM)
//   const webcamRef = useRef(null);
//   const boundingBoxRef = useRef(null);
//   const fileInputRef = useRef(null);

//   // state to track input source (webcam or file)
//   const [inputSource, setInputSource] = useState("webcam");
//   const [selectedImage, setSelectedImage] = useState(null);

//   // function to load COCO-SSD model and start object detection
//   const runCoco = async () => {
//     const net = await cocossd.load(); // load the COCO-SSD model
//     console.log("COCO-SSD model loaded.");

//     // continuously detect objects in the video stream
//     setInterval(() => {
//       detectWebcam(net); // call the detect function repeatedly
//     }, 10);
//   };

//   // function to detect objects in the video stream
//   const detectWebcam = async (net) => {
//     // check if webcam video data is available
//     if (
//       webcamRef.current &&
//       typeof webcamRef.current !== "undefined" &&
//       webcamRef.current !== null &&
//       webcamRef.current.video.readyState === 4
//     ) {
//       // get video properties
//       const video = webcamRef.current.video;
//       const videoWidth = video.videoWidth;
//       const videoHeight = video.videoHeight;

//       // set canvas dimensions to match video dimensions
//       video.width = videoWidth;
//       video.height = videoHeight;
//       boundingBoxRef.current.width = videoWidth;
//       boundingBoxRef.current.height = videoHeight;

//       // make object detections
//       const obj = await net.detect(video);

//       // draw bounding boxes around detected objects
//       const ctx = boundingBoxRef.current.getContext("2d");
//       ctx.clearRect(0, 0, videoWidth, videoHeight); // clear the canvas

//       // check if webcam feed is mirrored
//       const isMirrored =
//         webcamRef.current.video.style.transform === "scaleX(-1)";

//       // adjust bounding box coordinates if mirrored
//       drawRect(obj, ctx, videoWidth, videoHeight, isMirrored);
//     }
//   };

//   // load COCO-SSD model when component mounts
//   useEffect(() => {
//     runCoco();
//   }, []);

//   // state to store the URL of the selected image file
//   const [imageUrl, setImageUrl] = useState(null);

//   // event handler for changing input source (webcam or file)
//   const handleSourceChange = async (event) => {
//     const newInputSource = event.target.value;
//     setInputSource(newInputSource);

//     // reset file input value when switching to image input source
//     if (newInputSource === "file") {
//       fileInputRef.current.value = null; // reset file input value
//       fileInputRef.current.click();
//     }

//     // if switching back to image file and an image was previously selected, display it
//     if (newInputSource !== "webcam" && imageUrl) {
//       const img = new Image();
//       img.onload = async () => {
//         const ctx = boundingBoxRef.current.getContext("2d");

//         // clear the canvas
//         ctx.clearRect(
//           0,
//           0,
//           boundingBoxRef.current.width,
//           boundingBoxRef.current.height
//         );

//         // calculate scaling factors to fit the image within the canvas
//         const scaleFactor = Math.min(
//           boundingBoxRef.current.width / img.width,
//           boundingBoxRef.current.height / img.height
//         );

//         // calculate scaled dimensions
//         const scaledWidth = img.width * scaleFactor;
//         const scaledHeight = img.height * scaleFactor;

//         // calculate position to center the image
//         const x = (boundingBoxRef.current.width - scaledWidth) / 2;
//         const y = (boundingBoxRef.current.height - scaledHeight) / 2;

//         // draw the image on the canvas
//         ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

//         // if switching back to image file, perform detections again
//         const net = await cocossd.load();
//         const obj = await net.detect(boundingBoxRef.current);
//         drawRect(obj, ctx); // draw detections on the canvas
//       };

//       img.src = imageUrl;
//     }
//   };

//   // event handler for selecting a file
//   const handleFileChange = async (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const imageUrl = URL.createObjectURL(file);
//       setImageUrl(imageUrl); // store the URL of the selected image
//       setSelectedImage(file.name); // update selected image state
//       const net = await cocossd.load();
//       detectImage(net, imageUrl);
//     }
//   };

//   // function to detect objects in an image file
//   const detectImage = async (net, imageFile) => {
//     const img = document.createElement("img");
//     img.src = imageFile;
//     img.onload = async () => {
//       const ctx = boundingBoxRef.current.getContext("2d");

//       // clear the canvas
//       ctx.clearRect(
//         0,
//         0,
//         boundingBoxRef.current.width,
//         boundingBoxRef.current.height
//       );

//       // calculate scaling factors to fit the image within the canvas
//       const scaleFactor = Math.min(
//         boundingBoxRef.current.width / img.width,
//         boundingBoxRef.current.height / img.height
//       );

//       // calculate scaled dimensions
//       const scaledWidth = img.width * scaleFactor;
//       const scaledHeight = img.height * scaleFactor;

//       // calculate position to center the image
//       const x = (boundingBoxRef.current.width - scaledWidth) / 2;
//       const y = (boundingBoxRef.current.height - scaledHeight) / 2;

//       // draw the image on the canvas
//       ctx.drawImage(img, x, y, scaledWidth, scaledHeight);

//       // detect objects in the image
//       const obj = await net.detect(boundingBoxRef.current);
//       drawRect(obj, ctx); // draw detections on the canvas
//     };
//   };

//   return (
//     <div className="container">
//       <div className="dropdown">
//         <label className="dropdown-label">Input</label>
//         <select
//           className="form-select"
//           value={inputSource === "file" ? selectedImage : inputSource}
//           onChange={handleSourceChange}
//         >
//           <option value="webcam">Webcam</option>
//           {selectedImage && (
//             <option value={selectedImage}>{selectedImage}</option>
//           )}
//           <option value="file">Choose an image file...</option>
//         </select>
//       </div>

//       <div className="md_slider">
//         <label htmlFor="customRange1" className="form-label">
//           Max Detections
//         </label>
//         <input type="range" className="form-range" id="customRange1" />
//       </div>

//       <div className="st_slider">
//         <label htmlFor="customRange2" className="form-label">
//           Score Threshold
//         </label>
//         <input type="range" className="form-range" id="customRange2" />
//       </div>

//       <div className="webcam">
//         {inputSource === "webcam" && (
//           <Webcam ref={webcamRef} muted={true} className="webcam-feed" />
//         )}
//         <canvas
//           ref={boundingBoxRef}
//           className={
//             inputSource === "webcam" ? "webcam-canvas" : "image-canvas"
//           }
//         />
//       </div>

//       <input
//         type="file"
//         ref={fileInputRef}
//         onChange={handleFileChange}
//         style={{ display: "none" }}
//       />
//     </div>
//   );
// }

// export default App;
