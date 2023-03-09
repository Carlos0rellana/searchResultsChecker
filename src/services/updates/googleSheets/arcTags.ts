import { accessToGoogleSheets, updateGroupLinkValuesInSheet } from "../../../subscribers/googleSheets"
import { msgProgressBar } from "../../../types/progressBarMsgs"
import { linkValues, filterOptions } from "../../../types/urlToVerify"
import { genericFilter } from "../../../utils/genericUtils"
import { searchTagsInArcBucle } from "../../search/searchArcTags"

export const searchAndUpdateTagInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'tag',
        status: 'none'
      }
      const rowsOfTags = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchTagsInArcBucle(rowsOfTags)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          firstText: 'Update Tags in Sheets',
          lastText: 'updates.'
        }
        await updateGroupLinkValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se modificaron celdas.')
      }
    }
    return null
  } catch (_error) {
    //console.error(error)
    return null
  }
}