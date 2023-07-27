import { checkRedirect } from '../../subscribers/arcRedirects'
import { accessToGoogleSheets, updateRowLinkValues } from '../../subscribers/googleSheets'
import { modLinkValues, linkValues } from '../../types/urlToVerify'
import { allSites } from '../../utils/allSites'
import { searchBarConfig, checkBarConfig } from '../../utils/barUtils'
import { geIdentiflyUrl, sanitizePathToWWWWpath, delay, getSimpleLinkValues, fetchData, linkValuesToString } from '../../utils/genericUtils'

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

export const searchRedirectsBucle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
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
            await updateRowLinkValues(sheetId, 'Output', item.position,linkValuesToString(externalLink))
          } else if (redirect !== null) {
            externalLink.status = 'manual'
            externalLink.probableSolution = redirect
            externalLink.solution = ['redirect', 'resolver']
            await updateRowLinkValues(sheetId, 'Output', item.position,linkValuesToString(externalLink))
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
