//
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var myAudio = document.querySelector('audio');
var pre = document.querySelector('pre');
var myScript = document.querySelector('script');

var panControl = document.querySelector('.panning-control');
var panValue = document.querySelector('.panning-value');

pre.innerHTML = myScript.innerHTML;

// Create a MediaElementAudioSourceNode
// Feed the HTMLMediaElement into it
var source = audioCtx.createMediaElementSource(myAudio);

// Create a stereo panner
var panNode = audioCtx.createStereoPanner();

// Event handler function to increase panning to the right and left
// when the slider is moved

// Pan value is between -1 and 1
// Increments of 0.02 should be undiscenranble
let panLevel = -1;

panControl.oninput = function() {
  panNode.pan.value = panControl.value;
  panValue.innerHTML = panControl.value;
}

// connect the AudioBufferSourceNode to the gainNode
// and the gainNode to the destination, so we can play the
// music and adjust the panning using the controls
source.connect(panNode);
panNode.connect(audioCtx.destination);
  