const puppeteer = require('puppeteer')

const TARGET_URL = 'https://www.w3schools.com/tags/tryit.asp?filename=tryhtml5_video_autoplay'
// const TARGET_URL = 'https://meet.jit.si/TheBigBillys'

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

async function main() {
    console.log('[main] Launching browser')
    const browser = await puppeteer.launch(options)

    console.log('[main] Enable background log')
    const targets = await browser.targets()
    const backgroundPageTarget = targets.find(target => target.type() === 'background_page')
    const backgroundPage = await backgroundPageTarget.page()
    backgroundPage.on('error', msg => console.log(`[background] ${msg.text()}`))
    backgroundPage.on('console', msg => console.log(`[ERR][background] ${msg.text()}`))

    console.log('[main] Allow background download')
    await backgroundPage._client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR })

    console.log('[main] Creating page')
    let [page] = await browser.pages()
    if (!page) page = await browser.newPage()

    console.log('[main] browsing URL')
    await page.goto(TARGET_URL)
    await page.setBypassCSP(true)

    console.log('[main] Enable page log')
    page.on('console', msg => console.log('[page]', msg.text()))
    page.on('error', msg => console.log(`[ERR][page] ${msg.text()}`))

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
      window.sendRecorderMessage({ type: 'REC_CLIENT_PLAY', data: { url: window.location.origin } })

      await new Promise(resolve => setTimeout(resolve, 9915000))

      console.log('[main] Dispatch REC_CLIENT_STOP')
      window.sendRecorderMessage({ type: 'REC_CLIENT_STOP' })

      await new Promise(resolve => setTimeout(resolve, 2000))
    }, TAG_TARGET_NAME)

    console.log('[main] Recording over. Exiting')
    await page.close()
    await browser.close()
}

main()
