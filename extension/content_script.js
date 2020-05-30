// window.onload = () => {
//   // const runtime = 
//   document.addEventListener('recorderMessage', function (event) {
//     chrome.runtime.connect(chrome.runtime.id).postMessage(event.detail);
//   })
// }
document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('start')
  startButton.onclick = () => {
    chrome.runtime.connect(chrome.runtime.id).postMessage({ type: 'REC_CLIENT_PLAY' });
  }
})