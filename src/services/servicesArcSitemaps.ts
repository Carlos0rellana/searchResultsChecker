import { accessToGoogleSheets, updateAgroupOfValuesInSheet } from '../subscribers/googleSheets'
import { searchInSitemapByDate } from '../subscribers/searchInSitemaps'
import { msgProgressBar } from '../types/progressBarMsgs'
import { modLinkValues, linkValues } from '../types/urlToVerify'
import { searchBarConfig } from '../utils/barUtils'
import { getSimpleLinkValues, geIdentiflyUrl } from '../utils/genericUtils'

import sitesData from '../config/static_data/blocks.json'
import { SitesList } from '../types/sites'
const allSites: SitesList = sitesData as SitesList

const filterByDate = async (rows: string[][]): Promise<modLinkValues[]> => {
  const rowsOfRedirect: modLinkValues[] = []
  let key: number = 0
  const progressRevisionOfSearch = searchBarConfig('Search URL in sitemaps')

  const datePattern = /[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g

  progressRevisionOfSearch.start(rows.length, 0)
  for (const urlValidate of rows) {
    const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
    if (rowData.url !== null &&
        rowData.status !== 'ok' &&
        rowData.status === 'none' &&
        rowData.httpStatus !== null &&
        rowData.httpStatus >= 400 &&
        rowData.httpStatus < 500) {
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
            rowsOfRedirect.push(rowData)
          }
        }
      }
    }
    key++
    progressRevisionOfSearch.update(key)
  }
  progressRevisionOfSearch.stop()
  return rowsOfRedirect
}

export const checkByDatesFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')

    if (rows !== undefined && rows !== null) {
      const rowsOfRedirect = await filterByDate(rows)
      if (await rowsOfRedirect.length > 0) {
        const barText: msgProgressBar = {
          description: 'Guardando urls encontradas por fechas',
          nameItems: 'Url guardadas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsOfRedirect, barText)
        return rowsOfRedirect
      } else {
        console.log('No se encontrarons links con fechas')
      }
    }
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}
