import { accessToGoogleSheets } from '../../subscribers/googleSheets'
import { modLinkValues } from '../../types/urlToVerify'
import { getSimpleLinkValues } from '../../utils/genericUtils'

export const checkAuthorInOutput = async (sheetId: string, filter: boolean = false): Promise<any> => {
  try {
    const currentList: modLinkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    rows?.forEach((row, key) => {
      const rowData: modLinkValues = getSimpleLinkValues(row, key)
      if (rowData.typeOfUrl === 'author') {
        if (!filter) {
          currentList.push(rowData)
        }
        if (filter && parseInt(row[1]) > 499) {
          currentList.push(rowData)
        }
      }
    })
  } catch (error) {
    console.error(error)
    return null
  }
}
