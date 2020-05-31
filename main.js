const puppeteer = require('puppeteer')

// const TARGET_URL = 'http://clips.vorwaerts-gmbh.de/big_buck_bunny.ogv'
const TARGET_URL = 'https://meet.jit.si/TheBigBillys#config.startWithAudioMuted=true&config.startWithVideoMuted=true'
// const TARGET_URL = 'https://meet.jit.si/TheBigBillys'
// const TARGET_URL = 'https://www.youtube.com/watch?v=5qap5aO4i9A'

const EXTENSION_PATH = 'extension'
const DOWNLOAD_DIR = '/tmp/recordings'
const TAG_TARGET_NAME = 'pickme'

const options = {
  headless: false,
  ignoreDefaultArgs: [
    '--mute-audio',
    '--disable-extensions',
  ],
  args: [
    '--enable-usermedia-screen-capturing',
    '--allow-http-screen-capture',
    '--no-sandbox',
    `--auto-select-desktop-capture-source=${TAG_TARGET_NAME}`,
    '--disable-setuid-sandbox',
    '--use-fake-ui-for-media-stream',
    `--load-extension=${EXTENSION_PATH}`,
    `--disable-extensions-except=${EXTENSION_PATH}`,
    '--autoplay-policy=no-user-gesture-required',
    '--disable-infobars',
    '--disable-component-extensions-with-background-pages',
    // '--use-fake-device-for-media-stream',
    // '--use-file-for-fake-audio-capture=/dev/urandom',
  ],
}

const makeLogProxy = prefix => (async msg => {
  function describe(jsHandle) {
    return jsHandle.executionContext().evaluate(obj => {
      return JSON.stringify(obj)
    }, jsHandle)
  }
  const args = await Promise.all(msg.args().map(arg =>
     typeof arg === 'string' ? arg : describe(arg)
  )).catch(_ => undefined)
  console.log(prefix, ...(args || []))
})

async function main() {
    console.log('[main] Launching browser')
    const browser = await puppeteer.launch(options)

    console.log('[main] Enable background log')
    const targets = await browser.targets()
    const backgroundPageTarget = targets.find(target => target.type() === 'background_page')
    const backgroundPage = await backgroundPageTarget.page()
    backgroundPage.on('error', makeLogProxy('[ERR][background]'))
    backgroundPage.on('console', makeLogProxy('[background]'))

    console.log('[main] Allow background download')
    await backgroundPage._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR })

    console.log('[main] Creating page')
    let [page] = await browser.pages()
    if (!page) page = await browser.newPage()

    console.log('[main] browsing URL')
    await page.goto(TARGET_URL)
    await page.setBypassCSP(true)

    console.log('[main] Enable page log')
    page.on('error', makeLogProxy('[ERR][page]'))
    page.on('console', makeLogProxy('[page]'))

    console.log('[main] moving to page context')
    await page.evaluate(async (TAG_TARGET_NAME) => {
      console.log('[main] arrived in page context')

      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('[main] Setting document title')
      document.title = TAG_TARGET_NAME

      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('[main] Define window recorder function')
      window.sendRecorderMessage = detail => {
          document.dispatchEvent(new CustomEvent('recorderMessage', { detail }), '*')
      }

      console.log('[main] Dispatch REC_CLIENT_PLAY')
      window.sendRecorderMessage({ type: 'REC_CLIENT_PLAY' })

      await new Promise(resolve => setTimeout(resolve, 20000))

      console.log('[main] Dispatch REC_CLIENT_STOP')
      window.sendRecorderMessage({ type: 'REC_CLIENT_STOP' })

      await new Promise(resolve => setTimeout(resolve, 2000))
    }, TAG_TARGET_NAME)

    console.log('[main] Recording over. Exiting')
    await page.close()
    await browser.close()
}

main()
