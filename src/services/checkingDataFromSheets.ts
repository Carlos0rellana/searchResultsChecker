import { accessToGoogleSheets, updateAgroupOfValuesInSheet, updateRowData } from '../subscribers/googleSheets'
import { arcSimpleStory, filterOptions, linkValues, modLinkValues } from '../types/urlToVerify'
import { checkMetroDB } from '../subscribers/getArticleRedirectFromPublimetroDB'
import { searchInGoogleServiceApi } from '../subscribers/googleApiSearch'
import { delay, geIdentiflyUrl, genericFilter, getSimpleLinkValues } from '../utils/genericUtils'

import { identitySearch, SitesList } from '../types/sites'

import { msgProgressBar } from '../types/progressBarMsgs'
import { searchInBucleArc } from '../subscribers/arcSearch'
import { checkBarConfig, searchBarConfig } from '../utils/barUtils'

import sitesData from '../config/static_data/blocks.json'
const allSites: SitesList = sitesData as SitesList

const searchInMetroDatabase = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Metro DB:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = searchBarConfig('Search in Metro DB')

    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(linkData.url)
        const returnRedirect: string | null = await checkMetroDB(basicInfo.siteId, basicInfo.storyTitle)
        if (await returnRedirect !== null && allSites[basicInfo.siteId]?.siteProperties?.feedDomainURL !== undefined) {
          const urlBase: string = returnRedirect?.match('/') !== null ? allSites[basicInfo.siteId].siteProperties.feedDomainURL as string : ''
          linkData.probableSolution = urlBase + (returnRedirect !== null ? returnRedirect : '')
          linkData.solution = ['redirect']
          linkData.status = 'metro'
          findUrl.push(linkData)
          progressRevisionOfSearch.update(key)
          await delay(2000)
        }
      }
      key++
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

const searchInArcCirculate = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Arc Sites:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = searchBarConfig('Search in Arc Sites')

    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(linkData.url)
        const findURLinArc = await searchInBucleArc(basicInfo.siteId, basicInfo.storyTitle) as arcSimpleStory
        if (await findURLinArc.id !== undefined && allSites[findURLinArc.site]?.siteProperties?.feedDomainURL !== undefined) {
          const checkOrigin = basicInfo.siteId === findURLinArc.site
          const rootUrl = ((allSites[findURLinArc.site].siteProperties.feedDomainURL as string).length > 0) ? allSites[findURLinArc.site].siteProperties.feedDomainURL as string : ''
          linkData.probableSolution = checkOrigin ? findURLinArc.url : rootUrl + findURLinArc.url
          linkData.solution = checkOrigin ? ['redirect'] : ['re-circulate']
          if (findURLinArc.isTitleByIteration) {
            linkData.status = 'searchByTitle'
          } else {
            linkData.status = findURLinArc.id.match('_redirect_') === null ? 'circulate' : 'findUrlWithRedirectTo'
          }
          findUrl.push(linkData)
          progressRevisionOfSearch.update(key)
          await delay(2000)
        }
      }
      key++
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

const searchInGoogle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Google:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = searchBarConfig('Search in Google')

    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(linkData.url)
        const googleSearch = await searchInGoogleServiceApi(basicInfo.siteId, basicInfo.storyTitle)
        if (await googleSearch !== null && googleSearch === 'Too Many Requests') {
          progressRevisionOfSearch.update(key)
          progressRevisionOfSearch.stop()
          console.log('Se llega al limite de busquedas en GOOGLE.')
          return findUrl
        }
        if (await googleSearch !== null && googleSearch !== 'Too Many Requests') {
          const urlBase: string = allSites[basicInfo.siteId].siteProperties.feedDomainURL as string
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          linkData.probableSolution = urlBase + googleSearch
          linkData.solution = ['redirect']
          linkData.status = 'google'
          findUrl.push(linkData)
        }
        progressRevisionOfSearch.update(key)
        await delay(2000)
      }
      key++
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

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

export const check404inGoogle = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const currentListModValues: modLinkValues[] = []
    const progressRevision = checkBarConfig('LocalRedirects Ckeck\'s', 'Local\'s Checks')
    if (rows !== null) {
      let key: number = 0
      progressRevision.start(rows.length, 0)
      for (const row of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(row, key)
        if (rowData.typeOfUrl === 'story' && rowData.httpStatus === 404 && rowData.status === 'none') {
          let urlClear: identitySearch|null = null
          if (rowData.probableSolution !== null && rowData.probableSolution !== 'null' && rowData.probableSolution.length > 0 && rowData.status === 'none') {
            urlClear = geIdentiflyUrl(rowData.probableSolution)
          } else if (rowData.url !== null && rowData.url !== 'null' && rowData.url.length > 0) {
            urlClear = geIdentiflyUrl(rowData.url)
          }
          if (urlClear !== null && urlClear.storyTitle !== 'null' && rowData.status === 'none' && urlClear.storyTitle.length > 0) {
            const currentUrl: string | null = await checkMetroDB(urlClear.siteId, urlClear.storyTitle)
            if (currentUrl !== null) {
              rowData.probableSolution = currentUrl
              rowData.status = 'metro'
              rowData.solution = ['redirect']
              currentListModValues.push(rowData)
              const linkData = rowData as linkValues
              await updateRowData(sheetId, 'Output', rowData.position, linkData)
            } else {
              const urlSite = allSites[urlClear.siteId].siteProperties.feedDomainURL
              if (urlSite !== null && urlSite !== undefined) {
                const googleSearch = await searchInGoogleServiceApi(urlClear.siteId, urlClear.storyTitle)
                if (googleSearch !== null) {
                  rowData.probableSolution = googleSearch
                  rowData.solution = ['redirect']
                  rowData.status = 'google'
                  currentListModValues.push(rowData)
                  const linkData = rowData as linkValues
                  await updateRowData(sheetId, 'Output', rowData.position, linkData)
                }
              }
            }
            await delay(2000)
          }
        }
        key++
        progressRevision.update(key)
      }
    }
    progressRevision.stop()
    return currentListModValues
  } catch (error) {
    console.error(error)
  }
  return null
}

export const checkUrlInDBFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
      const rowsToSaveInSheet = await searchInMetroDatabase(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsOfRedirect
      } else {
        console.log('No se encontrarons links en base de datos de metro')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInGoogleFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
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

export const checkUrlInArcCirculateFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
      const rowsToSaveInSheet = await searchInArcCirculate(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas en sitios de Arc.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
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
