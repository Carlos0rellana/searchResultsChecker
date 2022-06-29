import { accessToGoogleSheets, createGoogleSheet } from '../subscribers/google-sheets'
import { linkValues, modLinkValues, statusCheck, typeOfLink } from '../types/urlToVerify'
// import { author } from '../types/author'
import { fetchData } from '../utils/getInfoFromUrlArc'

const simpleRowData = (lists: string[][]|null, showCellName: string): string[]|null => {
  if (lists !== null && lists.length > 0) {
    const currentSimpleList: string[] = []
    let find = false
    let position = 0
    lists[0].forEach((value, index) => {
      if (value === showCellName) {
        position = index
        find = true
      }
    })
    if (find) {
      lists.forEach((row, index) => {
        if (index !== 0) {
          currentSimpleList.push(row[position])
        }
      })
      return currentSimpleList
    }
    return null
  }
  return null
}

export const checkAuthorInOutput = async (sheetId: string, filter: boolean = false): Promise<any> => {
  try {
    const currentList: modLinkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    rows?.forEach((row, key) => {
      const rowData: modLinkValues = {
        url: row[0],
        httpStatus: Number(row[1]),
        typeOfUrl: row[2] as typeOfLink | null,
        outputType: row[3],
        problemLists: row[4],
        possibleSolution: row[5],
        status: row[6] as statusCheck,
        position: key + 2
      }
      if (rowData.typeOfUrl === 'author') {
        if (!filter) {
          currentList.push(rowData)
        }
        if (filter && parseInt(row[1]) > 499) {
          currentList.push(rowData)
        }
      }
    })
    console.log(currentList)
  } catch (error) {
    console.error(error)
    return null
  }
}

export const getUrlsFromSheets = async (sheetId: string): Promise<any> => {
  try {
    const urlList: linkValues[] = []
    const rows = simpleRowData(await accessToGoogleSheets(sheetId, 'Table'), 'URL')
    if (rows !== null) {
      let count: number = 0
      for (const item of rows) {
        let routeInPage = ''
        routeInPage = item
        const currentData = await fetchData(routeInPage)
        const externalLink: linkValues = currentData
        urlList.push(externalLink)
        console.log('Se revisa valor número => ', count)
        count++
      }
    }
    await createGoogleSheet(urlList, 'Output', sheetId)
    return urlList
  } catch (error) {
    console.error(error)
  }
}
