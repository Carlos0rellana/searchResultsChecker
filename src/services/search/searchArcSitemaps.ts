import { searchInSitemapByDate } from '../../subscribers/searchInSitemaps'
import { modLinkValues, statusCheck } from '../../types/urlToVerify'
import { allSites } from '../../utils/allSites'
import { searchBarConfig } from '../../utils/barUtils'
import { geIdentiflyUrl } from '../../utils/genericUtils'

const getUrlFromSitemap = async (hostName: string, dateFilter: string, storyTitle: string): Promise< string | null > => {
  const feedUrl = `${hostName}/arc/outboundfeeds/sitemap/${dateFilter.replace(/\//g, '-')}?outputType=xml`
  return await searchInSitemapByDate(feedUrl, storyTitle)
}
const getTimeSelector = (dateArticle: RegExpMatchArray): statusCheck => {
  const year = Number(dateArticle[0].split('/')[0])
  if (year >= 2022) {
    return 'arcTime'
  } else if (year >= 2016) {
    return 'recent'
  } else {
    return 'date'
  }
}

export const searchSitemaps = async (rowData: modLinkValues): Promise< modLinkValues | null > => {
  if (rowData.url !== null) {
    const datePattern = /[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g
    const dateArticle = rowData.url?.match(datePattern)
    if (dateArticle !== null) {
      const date = datePattern.exec(rowData.url)
      const basicInfo = geIdentiflyUrl(rowData.url)
      const hostName = allSites[basicInfo.siteId]?.siteProperties.feedDomainURL
      if (hostName !== undefined && date !== null && basicInfo.storyTitle.length > 0) {
        let dateFilter = date[0]
        if (rowData.url.split(datePattern).length > 2) {
          let myArray
          while ((myArray = datePattern.exec(rowData.url)) !== null) {
            dateFilter = myArray[0]
          }
        }
        const result = await getUrlFromSitemap(hostName, dateFilter, basicInfo.storyTitle)
        if (await result !== null) {
          rowData.solution = ['redirect']
          rowData.probableSolution = `${hostName}${result ?? ''}`
          rowData.status = getTimeSelector(dateArticle)
          return (rowData)
        } else {
          const excludeCurrentSite = Object.keys(allSites).filter(siteId => siteId !== basicInfo.siteId)
          for (const siteId of excludeCurrentSite) {
            const tempValue = await getUrlFromSitemap(siteId, dateFilter, basicInfo.storyTitle)
            if (tempValue !== null) {
              rowData.solution = ['re-circulate']
              rowData.status = 'circulate'
              rowData.probableSolution = `${hostName}${tempValue ?? ''}`
              return (rowData)
            }
          }
        }
      }
    }
  }
  return null
}

export const searchSitemapInBucle = async (rows: modLinkValues[]): Promise<modLinkValues[]> => {
  const rowsOfRedirect: modLinkValues[] = []
  let key: number = 0
  const progressRevisionOfSearch = searchBarConfig('Search URL in sitemaps')
  progressRevisionOfSearch.start(rows.length, 0)
  for (const urlValidate of rows) {
    const existInSitemap = await searchSitemaps(urlValidate)
    if (existInSitemap !== null) {
      rowsOfRedirect.push(existInSitemap)
    }
    key++
    progressRevisionOfSearch.update(key)
  }
  progressRevisionOfSearch.stop()
  return rowsOfRedirect
}
