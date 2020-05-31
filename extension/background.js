/* global chrome, MediaRecorder, FileReader */

const TIME_SLICE = 5000
const MIME_TYPE = 'audio/webm; codecs=pcm' 
const BIT_RATE = 128000

let recorder = null

function exportMedia(chunks) {
  console.log('Downloading media')
  const blob = new Blob(chunks, {
    type: MIME_TYPE,
  })
  chrome.downloads.download({
    url: URL.createObjectURL(blob),
  })
}

async function startRecording() {
  chrome.desktopCapture.chooseDesktopMedia(
    ['tab', 'audio'],
    streamId => {
      console.log('Selecting stream')
        navigator.webkitGetUserMedia(
          {
            audio: true,
            video: false,
          },
          stream => {
            console.log('Acquiring stream')
            recorder = new MediaRecorder(stream, {
              mimeType: MIME_TYPE,
              // audioBitsPerSecond: BIT_RATE,
              ignoreMutedMedia: true,
            })
            recorder.onerror = event => console.log('Unable to start recording:', event)
            recorder.ondataavailable = event => {
              console.log('recorder.dataavailable', event.data.size)
              exportMedia([event.data])
            }
            recorder.onstop = event => {
              console.log('recorder.stop', event)
            }
            recorder.start(TIME_SLICE)
            console.log('Recording started!')
          },
          error => console.log('Unable to get user media:', error.message),
        )
    },
  )
}

console.log('Started background script')
chrome.runtime.onConnect.addListener(port => {
  console.log('connected to chrome runtime')
  port.onMessage.addListener(async msg => {
    console.log('received new message')
    switch (msg.type) {
      case 'REC_CLIENT_STOP':
        console.log('Stopping recording')
        if (!port.recorderPlaying || !recorder) {
          console.log('Nothing to stop')
          return
        }
        port.recorderPlaying = false

        recorder.stop()
        console.log('Recording stopped!')
        break

      case 'REC_CLIENT_PLAY':
        console.log('Starting recording')
        if (port.recorderPlaying) {
          console.log('Ignoring second play, already playing')
          return
        }
        port.recorderPlaying = true

        await startRecording()

        break
      default:
        console.log('Unrecognized message:', msg)
    }
  })
})
