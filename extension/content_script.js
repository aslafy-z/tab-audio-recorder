console.log('[cs] Starting content script')
const runtime = chrome.runtime.connect(chrome.runtime.id)
console.log('[cs] Adding event listener')
document.addEventListener('recorderMessage', function (event) {
    console.log('[cs] Forwarding event', event.detail)
    runtime.postMessage(event.detail);
})
