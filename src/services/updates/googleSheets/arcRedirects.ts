import { updateGroupLinkValuesInSheet, accessToGoogleSheets } from '../../../subscribers/googleSheets'
import { msgProgressBar } from '../../../types/progressBarMsgs'
import { filterOptions, modLinkValues, linkValues } from '../../../types/urlToVerify'
import { genericFilter } from '../../../utils/genericUtils'
import { searchRedirectsBucle } from '../../search/searchArcRedirects'

const unificateUpdate = async (sheetId: string, barsConfig: {filter: filterOptions, update: msgProgressBar}, rows: string[][]|null): Promise<modLinkValues[]|null> => {
  if (rows !== null) {
    const rowsOfRedirect = genericFilter(rows, barsConfig.filter)
    const rowsToSaveInSheet = await searchRedirectsBucle(rowsOfRedirect)
    if (await rowsToSaveInSheet.length > 0) {
      await updateGroupLinkValuesInSheet(sheetId, rowsToSaveInSheet, barsConfig.update)
      return rowsToSaveInSheet
    } else {
      console.log('No se encontrarons redireccionamientos en Arc.')
    }
  }
  return null
}

const unificateCheckAndUpdate = async (sheetId: string, configFilter: filterOptions): Promise < modLinkValues[] | null > => {
  const rows = await accessToGoogleSheets(sheetId, 'Output')
  if (await rows !== null) {
    const filterData: filterOptions = {
      httpStatus: configFilter.httpStatus,
      method: configFilter.method,
      type: configFilter.type,
      status: configFilter.status
    }
    const updateData: msgProgressBar = {
      firstText: 'Update status',
      lastText: 'Url encontradas.'
    }
    return await unificateUpdate(sheetId, { filter: filterData, update: updateData }, rows)
  }
  return null
}

export const searchAndUpdateExternalRedirectsInSheets = async (sheetId: string): Promise< linkValues[] | null > => {
  try {
    const filterData: filterOptions = {
      httpStatus: 400,
      method: 'redirect',
      type: 'any',
      status: 'findUrlWithRedirectTo'
    }
    return await unificateCheckAndUpdate(sheetId, filterData)
  } catch (error) {
    console.error(error)
    return null
  }
}

export const searchAndUpdateRedirectsInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const filterData: filterOptions = {
      httpStatus: 400,
      method: null,
      type: 'any',
      status: 'none'
    }
    return await unificateCheckAndUpdate(sheetId, filterData)
  } catch (error) {
    console.error(error)
    return null
  }
}
