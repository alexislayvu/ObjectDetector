


/* 
var rangefield1 = document.getElementById("range");
output1 = document.getElementById("value1");
//output1.innerHTML = rangefield1.value;

rangefield1.oninput = function() {
    output1.innerHTML = this.value;
} */

var rangefield2 = document.getElementById("range2");
window.output2 = document.getElementById("value2");

output2.innerHTML = rangefield2.value;

rangefield2.oninput = function() {
    output2.innerHTML = this.value;
    console.log("output2 changed to:", this.value); // Log the output2 value change
    // Dispatch a custom event to notify the change in output2 value
    var output2ChangeEvent = new Event("output2Change");
    window.dispatchEvent(output2ChangeEvent);
}

