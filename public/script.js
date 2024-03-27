

var rangefield1 = document.getElementById("range");
var output1 = document.getElementById("value1");

output1.innerHTML = rangefield1.value;

rangefield1.oninput = function() {
    output1.innerHTML = this.value;
}


var rangefield2 = document.getElementById("range2");
var output2 = document.getElementById("value2");

output2.innerHTML = rangefield2.value;

rangefield2.oninput = function() {
    output2.innerHTML = this.value;
}


// Get references to the range input elements and their output elements
var range1 = document.getElementById("range");
var output1 = document.getElementById("value1");
var range2 = document.getElementById("range2");
var output2 = document.getElementById("value2");

// Store the selected values from the sliders
var maxScoreThreshold = range1.value;
var maxDetection = range2.value;

// Update the output elements with the initial values
output1.innerHTML = maxScoreThreshold;
output2.innerHTML = maxDetection;

// Event handler for the score threshold slider
range1.oninput = function() {
    maxScoreThreshold = this.value;
    output1.innerHTML = maxScoreThreshold;
}

// Event handler for the max detection slider
range2.oninput = function() {
    maxDetection = this.value;
    output2.innerHTML = maxDetection;
}

// Function to perform object detection with the selected parameters
function detectObjects() {
    // Perform object detection with TensorFlow using maxScoreThreshold and maxDetection
    // Limit the number of detected objects based on the selected maxDetection value
    // Update the webcam feed with the detected objects
}
