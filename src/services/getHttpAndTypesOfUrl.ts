import { accessToGoogleSheets, createGoogleSheet } from '../subscribers/googleSheets'
import { linkValues } from '../types/urlToVerify'
import { fetchData, simpleRowData } from '../utils/genericUtils'

import cliProgress from 'cli-progress'
import colors from 'ansi-colors'

export const checkUrlsStatusFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
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
        urlList.push(externalLink)
        progressRevision.update(count)
        count++
      }
      progressRevision.stop()
    }
    await createGoogleSheet(urlList, 'Output', sheetId)
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}
