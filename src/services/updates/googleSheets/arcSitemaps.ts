import { accessToGoogleSheets, updateGroupLinkValuesInSheet } from '../../../subscribers/googleSheets'
import { msgProgressBar } from '../../../types/progressBarMsgs'
import { linkValues, filterOptions } from '../../../types/urlToVerify'
import { genericFilter } from '../../../utils/genericUtils'
import { searchSitemapInBucle } from '../../search/searchArcSitemaps'

export const searchAndUpdateSitemapsInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (rows !== undefined && rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'any',
        status: 'none'
      }
      const storiesList = genericFilter(rows, options)
      const rowsOfRedirect = await searchSitemapInBucle(storiesList)
      if (await rowsOfRedirect.length > 0) {
        const barText: msgProgressBar = {
          firstText: 'Guardando urls encontradas por fechas',
          lastText: 'Url guardadas.'
        }
        await updateGroupLinkValuesInSheet(sheetId, rowsOfRedirect, barText)
        return rowsOfRedirect
      } else {
        console.log('No se encontrarons links con fechas')
      }
    }
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}
