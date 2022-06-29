import { google, sheets_v4 } from 'googleapis'
import { GoogleAuth } from 'googleapis-common'
import { linkValues } from '../types/urlToVerify'

const googleInfo = {
  keyFile: './src/config/googleAccess.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly']
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

export const createGoogleSheet = async (arr: linkValues[], sheetname: string, spreadsheetId: string): Promise<linkValues[]|null> => {
  try {
    const auth = new google.auth.GoogleAuth(googleInfo)
    const sheets = await google.sheets('v4')
    const tempArray: string[][] = []
    tempArray.push(['URL', 'httpStatus', 'typeOfUrl', 'outputType', 'problems', 'possibleSolution', 'status'])
    for (let index = 0; index < arr.length; index++) {
      tempArray.push([
        String(arr[index].url),
        String(arr[index].httpStatus),
        String(arr[index].typeOfUrl),
        String(arr[index].outputType),
        String(arr[index].problemLists),
        String(arr[index].possibleSolution),
        arr[index].status
      ])
    }
    const requestForData = {
      spreadsheetId: spreadsheetId,
      range: sheetname,
      valueInputOption: 'USER_ENTERED',
      resource: {
        majorDimension: 'ROWS',
        values: tempArray
      },
      auth
    }

    await createNewSheet(sheets, spreadsheetId, sheetname, auth)
    const result = await sheets.spreadsheets.values.update(requestForData)
    console.log(result)
  } catch (error) {
    console.log(error)
  }

  return null
}

export const updateRowData = async (spreadSheetId: string, sheetName: string, position: number, dataValues: linkValues): Promise<any> => {
  const auth = new google.auth.GoogleAuth(googleInfo)
  const sheets = await google.sheets('v4')
  const requestForData = {
    spreadsheetId: spreadSheetId,
    range: `${sheetName}!A${position}:G${position}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      majorDimension: 'ROWS',
      values: [[
        dataValues.url,
        dataValues.httpStatus,
        dataValues.typeOfUrl,
        dataValues.outputType,
        dataValues.problemLists,
        dataValues.possibleSolution,
        dataValues.status
      ]]
    },
    auth
  }
  const result = await sheets.spreadsheets.values.update(requestForData)
  return result
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
