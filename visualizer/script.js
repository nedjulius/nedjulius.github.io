const canvas = document.getElementById("audio_visual");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");
const audioElement = document.getElementById("source");
audioElement.volume = 0.5;
const audioCtx = new AudioContext();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048;
const source = audioCtx.createMediaElementSource(audioElement);
source.connect(analyser);
source.connect(audioCtx.destination);
let data = new Uint8Array(analyser.frequencyBinCount);

const resumeAudio = () => audioCtx.resume();

const stopAudio = () => audioCtx.stop();

const loopFn = () => {
  requestAnimationFrame(loopFn);
  analyser.getByteFrequencyData(data);
  draw(data);
}

requestAnimationFrame(loopFn);

const calculateRMS = (data) => {
  return Math.sqrt(data.reduce((acc, curr) => acc + curr * curr, 0) / data.length);
}

const resetStrokeDefaults = () => {
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000';
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

const setLineStyle = (style, width, opacity = 1) => {
  ctx.lineWidth = width;
  ctx.strokeStyle = style;
  ctx.globalAlpha = opacity;
}

const drawLine = (from, to) => {
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
}

const drawArc = (x, y, r, sAngle, eAngle) => {
  ctx.beginPath();
  ctx.arc(x, y, r, sAngle, eAngle);
  ctx.stroke();
}

const draw = (data) => {
  const rms = calculateRMS(data);
  console.log(rms);
  data = [...data];
  const {width, height} = canvas;
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createRadialGradient(width / 2, height / 2, rms * 2, width / 2, height / 2, rms * 10);
  gradient.addColorStop(0, "#85ffd6");
  gradient.addColorStop(1, "#00d18b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  setLineStyle("white", 9);
  drawArc(width / 2, height / 2, rms, 0, 2 * Math.PI);
  setLineStyle("white", 20);
  drawArc(width / 2, height / 2, rms * 2, 0, 2 * Math.PI);
  setLineStyle("black", 2);
  drawArc(width / 2, height / 2, rms * 2 + 9, 0, 2 * Math.PI);

  if (rms >= 90) {
    setLineStyle("white", 50, 0.3);
    drawArc(width / 2, height / 2, rms * 3, 0, 2 * Math.PI);
    setLineStyle("white", 30, 0.2);
    drawArc(width / 2, height / 2, rms * 2.9, 0, 2 * Math.PI);
  }

  resetStrokeDefaults();

  const space = width / height;

  data.forEach((value, index) => {
    const yPos = space * index;
    setLineStyle("white", 2, 0.5);
    drawLine([width, yPos], [width - value, yPos]);
    drawLine([0, yPos], [value, yPos]);
    resetStrokeDefaults();
  });
}

document.getElementById("upload-button").addEventListener("click", () => {
  const fileUpload = document.getElementById("upload");

  if (!fileUpload.files || fileUpload.files.length === 0) {
    alert("Please upload file before playing!");
    return;
  }

  document.getElementById("uploader-container").classList.add("hidden");
  document.getElementById("audio_visual").classList.add("visible");
  const source = document.getElementById("source");
  source.src = URL.createObjectURL(fileUpload.files[0]);
  source.play();
});

