

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


