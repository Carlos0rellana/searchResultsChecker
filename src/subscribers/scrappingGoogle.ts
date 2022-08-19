import playwrigth from 'playwright'
import { typeOfLink } from '../types/urlToVerify'

export const getAsyncWebSearch = async (siteUrl: string, toSearch: string, priority: string | null = null): Promise<string|null> => {
  console.log('se entra a la busqueda')
  const launchOptions = {
    proxy: {
      server: '165.225.76.168:10605'
    }
  }
  try {
    let comparedStringType: string = '/galeria'
    const browser = await playwrigth.chromium.launch(launchOptions)
    const page = await browser.newPage()
    const type = priority as typeOfLink
    if (type === 'gallery') {
      comparedStringType = '/video'
    }
    await page.goto(`https://www.google.com/search?q=site: ${siteUrl}+${toSearch}`)
    await page.waitForTimeout(10000)
    const results = await page.$('#search')
    await page.screenshot({ path: 'my_screenshot.png' })
    const hrefLists = await results?.$$eval('a', as => as.map(a => a.href))
    if (hrefLists !== undefined && hrefLists !== null) {
      for (const element of hrefLists) {
        if ((!element.includes(`site: ${siteUrl}`) &&
             !element.includes(`site:${siteUrl}`)) &&
              element.includes(toSearch) &&
              element.includes(siteUrl)) {
          if (priority !== null && element.includes(comparedStringType)) {
            return element
          }
          if (priority === null && !element.includes('/galeria') && !element.includes('/galeria')) {
            return element
          }
        }
      }
      return null
    }
    await browser.close()
  } catch (error) {
    console.error(error)
  }
  return null
}
