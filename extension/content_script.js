window.onload = () => {
  const runtime = chrome.runtime.connect(chrome.runtime.id)
  document.addEventListener('recorderMessage', function (event) {
    runtime.postMessage(event.detail);
  })
}
