import { accessToGoogleSheets, createGoogleSheet } from '../subscribers/googleSheets'
import { linkValues } from '../types/urlToVerify'
import { fetchData, simpleRowData } from '../utils/genericUtils'

import cliProgress from 'cli-progress'
import colors from 'ansi-colors'

export const checkUrlsStatusFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const start = new Date().getTime()
    const urlList: string[][] = []
    const retuntList: linkValues[] = []
    urlList.push(['URL', 'httpStatus', 'typeOfUrl', 'outputType', 'solution', 'method', 'status'])
    const rows = await simpleRowData(await accessToGoogleSheets(sheetId, 'Table'), 'URL')
    const progressRevision = new cliProgress.SingleBar({
      format: `HTTP Request Progress | ${colors.cyan('{bar}')} | {percentage}% || {value}/{total} URL's`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== undefined && rows !== null) {
      progressRevision.start(rows.length, 0)
      let count: number = 1
      for (const item of rows) {
        let routeInPage = ''
        routeInPage = item
        const currentData = await fetchData(routeInPage)
        const externalLink: linkValues = currentData
        retuntList.push(externalLink)
        urlList.push([
          String(externalLink.url),
          String(externalLink.httpStatus),
          String(externalLink.typeOfUrl),
          String(externalLink.outputType),
          String(externalLink.probableSolution),
          String(externalLink.solution),
          externalLink.status
        ])
        progressRevision.update(count)
        count++
      }
      progressRevision.stop()
    }
    await createGoogleSheet(urlList, 'Output', sheetId)
    const end = (new Date().getTime() - start) / 60000
    console.log('\nTiempo de ejecución ===>', end, ' min.\n')
    return retuntList
  } catch (error) {
    console.error(error)
    return null
  }
}
