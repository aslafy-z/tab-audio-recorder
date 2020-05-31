import puppeteer from 'puppeteer'

const EXTENSION_PATH = 'extension'
const DOWNLOAD_DIR = '/tmp/recordings'
const TAG_TARGET_NAME = 'pickme'
// TODO: Remove / fix line below, expanded to `undefined` at runtime
// const EXTENSION_ID = process.env.EXTENSION_ID

const options = {
  // executablePath: "/usr/bin/google-chrome-stable",
  headless: false,
  ignoreDefaultArgs: [
    '--mute-audio',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages'
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
    // `--whitelisted-extension-id=${EXTENSION_ID}`,
    // '--use-fake-device-for-media-stream',
    // '--use-file-for-fake-audio-capture=/dev/urandom',
  ],
}
async function main() {
    console.log('[ex] Launching browser')
    const browser = await puppeteer.launch(options)

    console.log('[ex] Getting background target')
    const targets = await browser.targets();
    const backgroundPageTarget = targets.find(target => target.type() === 'background_page');
    const backgroundPage = await backgroundPageTarget.page();
    console.log('[ex] Enable background log')
    backgroundPage.on('error', msg => console.log(`[bg] ${msg.text()}`));
    backgroundPage.on('console', msg => console.log(`[ERR][bg] ${msg.text()}`));


    console.log('[ex] Allow background download')
    await backgroundPage._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: DOWNLOAD_DIR});

    console.log('[ex] Creating page')
    let [page] = await browser.pages()
    if (!page) page = await browser.newPage()

    console.log('[ex] browsing URL')
    await page.goto('https://www.w3schools.com/tags/tryit.asp?filename=tryhtml5_video_autoplay')
    // await page.goto('https://www.youtube.com/watch?v=lTRiuFIWV54')
    // await page.goto('https://meet.jit.si/TheBigBillys')
    await page.setBypassCSP(true)
    
    // await page.click('document.querySelectorAll(\'div[role="button"]\')[3]')
    page.on('console', msg => {
      console.log('[p]', msg.text())
    });
    page.on('error', msg => console.log(`[ERR][p] ${msg.text()}`));

    console.log('[ex] moving to page context')
    await page.evaluate(async (TAG_TARGET_NAME) => {
      console.log('[ex] arrived in page context')

      await new Promise(resolve => setTimeout(resolve, 1000))

      console.log('[ex] Setting document title')
      document.title = TAG_TARGET_NAME

      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('[ex] Define window recorder function')
      window.sendRecorderMessage = detail => {
          document.dispatchEvent(new CustomEvent('recorderMessage', { detail }), '*')
      }

      console.log('[ex] Dispatch REC_CLIENT_PLAY')
      window.sendRecorderMessage({ type: 'REC_CLIENT_PLAY', data: { url: window.location.origin } })

      await new Promise(resolve => setTimeout(resolve, 9915000))

      console.log('[ex] Dispatch REC_CLIENT_STOP')
      window.sendRecorderMessage({ type: 'REC_CLIENT_STOP' })

      await new Promise(resolve => setTimeout(resolve, 2000))
    }, TAG_TARGET_NAME)

    console.log('[ex] Recording over. Exiting')
    await page.close()
    await browser.close()
}

main()
