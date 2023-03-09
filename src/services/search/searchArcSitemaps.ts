import { searchInSitemapByDate } from "../../subscribers/searchInSitemaps"
import { modLinkValues } from "../../types/urlToVerify"
import { allSites } from "../../utils/allSites"
import { searchBarConfig } from "../../utils/barUtils"
import { geIdentiflyUrl } from "../../utils/genericUtils"


export const searchSitemaps =async (rowData:modLinkValues): Promise< modLinkValues | null > => {
  if(rowData.url !== null){
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
        const feedUrl = `${hostName}/arc/outboundfeeds/sitemap/${dateFilter.replace(/\//g, '-')}?outputType=xml`
        const result = await searchInSitemapByDate(feedUrl, basicInfo.storyTitle)
        if (await result !== null) {
          rowData.solution = ['redirect']
          rowData.probableSolution = `${hostName}${result ?? ''}`
          const year = Number(dateArticle[0].split('/')[0])
          if (year >= 2022) {
            rowData.status = 'arcTime'
          } else if (year >= 2016) {
            rowData.status = 'recent'
          } else {
            rowData.status = 'date'
          }
          return(rowData)
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
    if(existInSitemap !== null){
      rowsOfRedirect.push(existInSitemap)
    }
    key++
    progressRevisionOfSearch.update(key)
  }
  progressRevisionOfSearch.stop()
  return rowsOfRedirect
}
