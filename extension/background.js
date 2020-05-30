/* global chrome, MediaRecorder, FileReader */

const TIME_SLICE = 1000
const MIME_TYPE = 'audio/webm' // ; codecs=pcm
const BIT_RATE = 32000

let recorder;

async function startRecording() {
  const options = { audio: true };
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      chrome.tabCapture.capture(options, (stream) => {
        console.log(`Last Error: ${JSON.stringify(chrome.runtime.lastError.message)}`);
        console.log(`Stream: ${JSON.stringify(stream)}`);

        try {
            recorder = new MediaRecorder(stream, {
              mimeType: 'video/webm; codecs=vp9',
            });
        } catch (err) {
            console.log(err.message);
            return;
        }

        console.log('Recroder is in place.');

        recorder.addEventListener('dataavailable', event => {
          console.log('dataavailable', JSON.stringify(event))
            const { data: blob, timecode } = event;
            console.log(`Got another blob: ${timecode}: ${blob}`);
            const url = URL.createObjectURL(blob)
            chrome.downloads.download({ url })
        });
        const timeslice = 5 * 1000;
        recorder.start(timeslice);
      });
  });

  // chrome.desktopCapture.chooseDesktopMedia(
  //   ['tab', 'audio'],
  //   streamId => {
  //     console.log('Selecting stream')
  //       navigator.webkitGetUserMedia(
  //         {
  //           audio: true,
  //           // video: false,
  //         },
  //         stream => {
  //           console.log('Acquiring stream')
  //           recorder = new MediaRecorder(stream, {
  //             mimeType: MIME_TYPE,
  //             // audioBitsPerSecond: BIT_RATE,
  //             ignoreMutedMedia: true,
  //           })
  //           recorder.onerror = event => console.log('Unable to start recording:', event)
  //           recorder.ondataavailable = event => {
  //               console.log('dataavailable', JSON.stringify(event.data.size))
  //               if (event.data.size > 0) {
  //                 console.log('Downloading slice')
  //                 const buffer = new Blob([event.data], {
  //                     type: MIME_TYPE,
  //                 })
  //                 const url = URL.createObjectURL(buffer)
  //                 chrome.downloads.download({ url })
  //               }
  //           }
  //           recorder.start(TIME_SLICE)
  //           console.log('Recording started!')
  //         },
  //         error => console.log('Unable to get user media:', chrome.runtime.lastError.message),
  //       )
  //   },
  // )
}

chrome.runtime.onConnect.addListener(port => {
  // let recorder = null

  port.onMessage.addListener(async msg => {
    switch (msg.type) {
      case 'REC_CLIENT_STOP':
        console.log('Stopping recording')
        if (!port.recorderPlaying || !recorder) {
          console.log('Nothing to stop')
          return
        }
        port.recorderPlaying = false

        // recorder.stop()
        console.log('Recording stopped!')
        break

      case 'REC_CLIENT_PLAY':
        console.log('Starting recording')
        if (port.recorderPlaying) {
          console.log('Ignoring second play, already playing')
          return
        }
        port.recorderPlaying = true
        // const tab = port.sender.tab
        // tab.url = msg.data.url 

        // console.log(chrome.tabCapture);
        startRecording()

        break
      default:
        console.log('Unrecognized message:', msg)
    }
  })
})
