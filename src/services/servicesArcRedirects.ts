import { checkRedirect } from '../subscribers/arcRedirects'
import { accessToGoogleSheets, updateRowData, updateAgroupOfValuesInSheet } from '../subscribers/googleSheets'
import { searchBarConfig, checkBarConfig } from '../utils/barUtils'
import { geIdentiflyUrl, sanitizePathToWWWWpath, delay, getSimpleLinkValues, fetchData, genericFilter } from '../utils/genericUtils'

import sitesData from '../config/static_data/blocks.json'

import { SitesList } from '../types/sites'
import { msgProgressBar } from '../types/progressBarMsgs'
import { modLinkValues, linkValues, filterOptions } from '../types/urlToVerify'

const allSites: SitesList = sitesData as SitesList

export const searchRedirect = async (linkData: modLinkValues): Promise <modLinkValues|null> => {
  if (linkData.url !== null) {
    const basicInfo = geIdentiflyUrl(sanitizePathToWWWWpath(linkData.url))
    const urlBase: string = allSites[basicInfo.siteId].siteProperties.feedDomainURL as string
    const pathUrl = new URL(linkData.url)
    let urlContest = pathUrl.pathname
    if (linkData.status === 'findUrlWithRedirectTo' && linkData.probableSolution !== null) {
      urlContest = linkData.probableSolution
    }
    let arcRedirectSearch = await checkRedirect(basicInfo.siteId, urlContest)
    if (await arcRedirectSearch !== null) {
      linkData.probableSolution = arcRedirectSearch?.match('/') !== null ? urlBase + (arcRedirectSearch !== null ? arcRedirectSearch : '') : arcRedirectSearch
      linkData.solution = ['redirect']
      linkData.status = 'olderRedirect'
      return (linkData)
    } else {
      if (pathUrl.pathname.match(/\/$/) !== null) {
        arcRedirectSearch = await checkRedirect(basicInfo.siteId, urlContest.replace(/.$/, ''))
      } else {
        arcRedirectSearch = await checkRedirect(basicInfo.siteId, `${urlContest}/`)
      }
      if (await arcRedirectSearch !== null) {
        const root: string = arcRedirectSearch?.match('/') !== null ? urlBase : ''
        linkData.probableSolution = root + (arcRedirectSearch !== null ? arcRedirectSearch : '')
        linkData.solution = ['redirect']
        linkData.status = 'olderRedirect'
        return (linkData)
      }
    }
  }
  return null
}

const unificateUpdate = async (sheetId: string, barsConfig: {filter: filterOptions, update: msgProgressBar}, rows: string[][]|null): Promise<modLinkValues[]|null> => {
  if (rows !== null) {
    const rowsOfRedirect = genericFilter(rows, barsConfig.filter)
    const rowsToSaveInSheet = await searchRedirectsBucle(rowsOfRedirect)
    if (await rowsToSaveInSheet.length > 0) {
      await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barsConfig.update)
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
      description: 'Update status',
      nameItems: 'Url encontradas.'
    }
    return await unificateUpdate(sheetId, { filter: filterData, update: updateData }, rows)
  }
  return null
}

const searchRedirectsBucle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Arc:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = searchBarConfig('Search in Arc')

    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      const tempValue = await searchRedirect(linkData)
      if (tempValue !== null) {
        findUrl.push(tempValue)
      }
      await delay(1000)
      key++
      progressRevisionOfSearch.update(key)
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

export const checkRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const rowsOfRedirect: modLinkValues[] = []
    let redirect: string|null = null
    const progressRevision = checkBarConfig('Search redirects', 'Redirects find')
    if (rows !== undefined && rows !== null) {
      let progressCount: number = 1
      let key: number = 0
      for (const urlValidate of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
        if ((rowData.status === 'process' || rowData.status === 'waiting-ok') &&
             rowData.httpStatus !== null &&
             rowData.httpStatus >= 400 &&
             rowData.httpStatus < 500) {
          rowsOfRedirect.push(rowData)
        }
        key++
      }
      progressRevision.start(rowsOfRedirect.length, 0)
      for (const item of rowsOfRedirect) {
        if (item.url !== null) {
          const URI = new URL(item.url)
          const earlyUrl = geIdentiflyUrl(item.url)
          const externalLink: linkValues = item as linkValues
          const originPath: string = URI.pathname
          redirect = await checkRedirect(earlyUrl.siteId, originPath)
          const httpResponseCheck = await fetchData(item.url)
          if (typeof httpResponseCheck.httpStatus === 'number' && httpResponseCheck.httpStatus < 400 && item.url !== 'undefined') {
            externalLink.status = 'ok'
            await updateRowData(sheetId, 'Output', item.position, externalLink)
          } else if (redirect !== null) {
            externalLink.status = 'manual'
            externalLink.probableSolution = redirect
            externalLink.solution = ['redirect', 'resolver']
            await updateRowData(sheetId, 'Output', item.position, externalLink)
          }
        }
        progressRevision.update(progressCount)
        progressCount++
      }
      progressRevision.stop()
    }
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInArcRedirectsFromSheetsWhenIsFoundInOtherUrl = async (sheetId: string): Promise< linkValues[] | null > => {
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

export const checkUrlInArcRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
