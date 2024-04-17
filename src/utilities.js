// object to store assigned colors for different classes
const colorMap = {};

// function to draw bounding boxes and labels for detected objects
export const drawRect = (detections, ctx, videoWidth, isMirrored) => {
  // loop through each detected object
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
