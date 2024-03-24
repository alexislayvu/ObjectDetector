// object to store assigned colors for different classes
const colorMap = {};

// Utility function to draw rectangles
export function drawRect(detections, ctx, videoWidth, videoHeight, isMirrored, accuracyThreshold) {
  detections.forEach((prediction) => {
    const [x, y, width, height] = prediction.bbox;

    // Draw only if detection meets accuracy threshold
    if (prediction.score >= accuracyThreshold) {
      console.log("prediction.score = ", prediction.score)
      console.log("accuracyThreshold = ", accuracyThreshold)
      // Draw bounding box
      ctx.beginPath();
      ctx.lineWidth = "2";
      ctx.strokeStyle = "green";
      ctx.rect(
        isMirrored ? videoWidth - x - width : x,
        y,
        width,
        height
      );
      ctx.stroke();
      // Add label
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(
        prediction.class + " - " + Math.round(prediction.score * 100) + "%",
        isMirrored ? videoWidth - x - width : x,
        y > 10 ? y - 5 : 10
      );
    }
  });
}

// function to draw bounding boxes and labels for detected objects
// export const drawRect = (
//   detections,
//   ctx,
//   videoWidth,
//   videoHeight,
//   isMirrored
// ) => {
//   // loop through each detected object
//   detections.forEach((prediction) => {
//     // extract bounding box coordinates, class, and confidence score
//     const [x, y, width, height] = prediction["bbox"];
//     const text = prediction["class"];
//     const score = prediction["score"];

//     // get or generate color for the class
//     const color = getColorForClass(text);

//     // set styling for the bounding box and label
//     ctx.lineWidth = 3;
//     ctx.strokeStyle = color;
//     ctx.font = "18px Arial";

//     // adjust coordinates if the webcam feed is mirrored
//     const adjustedX = isMirrored ? videoWidth - (x + width) : x;

//     // calculate dimensions and positions for the label
//     const textWidth = ctx.measureText(
//       `${text} ${Math.round(score * 100)}%`
//     ).width;
//     const textHeight = parseInt(ctx.font, 10);
//     const textX = adjustedX + width - textWidth - 5;
//     const textY = y + textHeight + 5;
//     const backgroundWidth = textWidth + 10;
//     const backgroundHeight = textHeight + 10;
//     const backgroundX = textX - 5;
//     const backgroundY = y;

//     // draw rectangles for bounding box and label background
//     ctx.beginPath();
//     ctx.rect(adjustedX, y, width, height);
//     ctx.stroke();
//     ctx.fillStyle = color;
//     ctx.fillRect(backgroundX, backgroundY, backgroundWidth, backgroundHeight);

//     // set text color to white and draw the label
//     ctx.fillStyle = "#ffffff";
//     ctx.fillText(`${text} ${Math.round(score * 100)}%`, textX, textY);
//   });
// };

// array of colors for different classs
const COLORS = [
  "#FF0000", // red
  "#FFA500", // orange
  "#008000", // green
  "#0000FF", // blue
  "#D300CF", // pink
  "#9400D3", // violet
];

// function to assign a color to a class or return the existing one
const getColorForClass = (className) => {
  // if the class already has a color assigned, return it
  if (colorMap[className]) {
    return colorMap[className];
  } else {
    // assign a color cyclically based on the number of unique classes
    const index = Object.keys(colorMap).length % COLORS.length;
    const color = COLORS[index];
    colorMap[className] = color;
    return color;
  }
};
