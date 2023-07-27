import { accessToGoogleSheets, updateRowLinkValues } from '../../../subscribers/googleSheets'
import { msgProgressBar } from '../../../types/progressBarMsgs'
import { linkValues, filterOptions } from '../../../types/urlToVerify'
import { searchBarConfig } from '../../../utils/barUtils'
import { genericFilter, linkValuesToString } from '../../../utils/genericUtils'
import { searchCirculate } from '../../search/searchArcCirculate'

export const searchAndUpdateCirculateInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
      if (await rowsOfRedirect.length > 0) {
        let searchListQty = 0
        const barText: msgProgressBar = {
          firstText: 'Update status URL in GoogleSheets ✍️',
          lastText: 'Url encontradas en sitios de Arc.'
        }
        const progressRevisionOfSearch = searchBarConfig(barText.firstText)
        progressRevisionOfSearch.start(rowsOfRedirect.length,searchListQty)
        for(const arcStory of rowsOfRedirect){
          const result = await searchCirculate(arcStory)
          await updateRowLinkValues(sheetId,'Output',arcStory.position,linkValuesToString(result))
          searchListQty++
          progressRevisionOfSearch.update(searchListQty)
        }
        progressRevisionOfSearch.stop()
      } else {
        console.log('No se encontrarons URL`s en Arc.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}
