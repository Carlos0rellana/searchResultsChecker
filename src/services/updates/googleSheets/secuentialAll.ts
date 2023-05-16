import { accessToGoogleSheets, updateRowLinkValues } from '../../../subscribers/googleSheets'
import { modLinkValues } from '../../../types/urlToVerify'
import { checkBarConfig } from '../../../utils/barUtils'
import { getSimpleLinkValues, delay } from '../../../utils/genericUtils'
import { searchPosibilities } from '../../search/searchAllPlacesUrls'

export const searchAndUpdatePosibilitiesInSheets = async (sheetId: string): Promise< modLinkValues[] | null > => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (rows !== undefined && rows !== null) {
      let key = 0
      const results: modLinkValues[] = []
      const start = new Date().getTime()
      const progressRevision = checkBarConfig('Search URL', 'check URL\'s')
      progressRevision.start(rows.length, 0)
      for (const info of rows) {
        const linkData: modLinkValues = getSimpleLinkValues(info, key)
        const tempValues = await searchPosibilities(linkData)
        if (tempValues !== null) {
          await updateRowLinkValues(sheetId, 'Output', tempValues.position, tempValues)
          results.push(tempValues)
          await delay(1000)
        }
        key++
        progressRevision.update(key)
      }
      progressRevision.stop()
      const end = (new Date().getTime() - start) / 60000
      console.log('\nTiempo de ejecución ===>', end, ' min.\n')
      return results
    } else {
      console.log('No se modificaron celdas.')
      return null
    }
  } catch (_error) {
    // console.error(error)
    return null
  }
}
