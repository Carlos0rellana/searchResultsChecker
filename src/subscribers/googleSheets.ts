import { google, sheets_v4 } from 'googleapis'
import { GoogleAuth } from 'googleapis-common'

import { linkValues, modLinkValues } from '../types/urlToVerify'
import { msgProgressBar } from '../types/progressBarMsgs'

import { delay } from '../utils/genericUtils'
import { checkBarConfig } from '../utils/barUtils'

const googleInfo = {
  keyFile: './src/config/googleAccess.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly']
}

export const checkSpreadSheet = async (sheetId: string, sheetName: string, caseSensitive: boolean = false): Promise <boolean> => {
  try {
    const auth = new google.auth.GoogleAuth(googleInfo)
    const sheets = await google.sheets('v4')
    const requestForData = {
      spreadsheetId: sheetId,
      auth
    }
    const specificSheets = (await sheets.spreadsheets.get(requestForData)).data.sheets
    if (specificSheets !== undefined) {
      for (const page of specificSheets) {
        let nameInSheet = page.properties?.title
        let nameToSearch = sheetName
        if (!caseSensitive) {
          nameInSheet = nameInSheet?.toLowerCase()
          nameToSearch = nameToSearch.toLowerCase()
        }
        if (nameInSheet === nameToSearch) {
          return true
        }
      }
    }
    return false
  } catch (error) {
    // console.log(error)
    return false
  }
}

export const accessToGoogleSheets = async (sheetId: string, sheetName: string): Promise<string[][]|null> => {
  const currentList: string[][] = []
  try {
    const auth = new google.auth.GoogleAuth(googleInfo)
    const sheets = await google.sheets('v4')
    const request = {
      spreadsheetId: sheetId,
      ranges: [sheetName],
      includeGridData: true,
      auth
    }
    try {
      const specificSheets = await sheets.spreadsheets.get(request)
      specificSheets.data.sheets?.forEach((value) => {
        value.data?.forEach((row) => {
          row.rowData?.forEach((cell) => {
            const rowValues: string[] = []
            cell.values?.forEach((element) => {
              rowValues.push(String(element.formattedValue))
            })
            currentList.push(rowValues)
          })
        })
      })
      return currentList
    } catch (error) {
      console.error(error)
    }
  } catch (error) {
    console.error(error)
  }
  if (await currentList.length > 0) {
    return currentList
  } else {
    return null
  }
}

export const createGoogleSheet = async (arr: string[][], sheetname: string, spreadsheetId: string): Promise<linkValues[]|null> => {
  try {
    const auth = new google.auth.GoogleAuth(googleInfo)
    const sheets = await google.sheets('v4')
    const requestForData = {
      spreadsheetId: spreadsheetId,
      range: sheetname,
      valueInputOption: 'USER_ENTERED',
      resource: {
        majorDimension: 'ROWS',
        values: arr
      },
      auth
    }

    await createNewSheet(sheets, spreadsheetId, sheetname, auth)
    await sheets.spreadsheets.values.update(requestForData)
  } catch (error) {
    console.log(error)
  }

  return null
}

export const updateRowData = async (spreadSheetId: string, sheetName: string, position: number, dataValues: string[]): Promise<any> => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']
  const auth = new google.auth.GoogleAuth(googleInfo)
  const sheets = await google.sheets('v4')
  const requestForData = {
    spreadsheetId: spreadSheetId,
    range: `${sheetName}!A${position}:${letters[dataValues.length - 1]}${position}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      majorDimension: 'ROWS',
      values: [dataValues]
    },
    auth
  }
  const result = await sheets.spreadsheets.values.update(requestForData)
  return result
}

export const updateRowLinkValues = async (spreadSheetId: string, sheetName: string, position: number, dataValues: linkValues): Promise<any> => {
  const dataToStringArray = [
    `${String(dataValues.url)}`,
    `${String(dataValues.httpStatus)}`,
    `${String(dataValues.typeOfUrl)}`,
    `${String(dataValues.outputType)}`,
    `${String(dataValues.probableSolution)}`,
    `${String(dataValues.solution?.join())}`,
    `${String(dataValues.status)}`
  ]
  return await updateRowData(spreadSheetId, sheetName, position, dataToStringArray)
}

export const updateGroupLinkValuesInSheet = async (sheetId: string, urlListToMod: modLinkValues[], textForBar: msgProgressBar): Promise<boolean> => {
  if (urlListToMod.length > 0) {
    const progressRevision = checkBarConfig(textForBar.firstText, textForBar.lastText)
    let progressCount: number = 1
    progressRevision.start(urlListToMod.length, 0)
    for (const item of urlListToMod) {
      if (item.url !== null) {
        const externalLink: linkValues = item as linkValues
        await updateRowLinkValues(sheetId, 'Output', item.position, externalLink)
        await delay(1000)
      }
      progressRevision.update(progressCount)
      progressCount++
    }
    progressRevision.stop()
    return true
  } else {
    return false
  }
}

const createNewSheet = async (sheets: sheets_v4.Sheets, spreadsheetId: string, sheetname: string, auth: GoogleAuth): Promise<boolean> => {
  try {
    await sheets.spreadsheets.batchUpdate({
      auth,
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: { title: sheetname }
          }
        }]
      }
    })
    return true
  } catch (error) {
    console.error('Error al crear sheet =>', error)
    return false
  }
}
