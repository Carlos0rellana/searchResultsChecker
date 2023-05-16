import { accessToGoogleSheets, updateGroupLinkValuesInSheet } from '../../../subscribers/googleSheets'
import { msgProgressBar } from '../../../types/progressBarMsgs'
import { linkValues, filterOptions } from '../../../types/urlToVerify'
import { genericFilter } from '../../../utils/genericUtils'
import { searchInGoogle } from '../../search/searchInGoogle'

export const searchAndUpdateGoogleInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'any',
        status: 'none'
      }
      const rowsOfRedirect = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchInGoogle(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          firstText: 'Update status URL in GoogleSheets',
          lastText: 'Url encontradas.'
        }
        await updateGroupLinkValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se encontrarons links en Google.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}
