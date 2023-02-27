import { checkMetroDB } from "../../subscribers/getArticleRedirectFromPublimetroDB"
import { accessToGoogleSheets, updateAgroupOfValuesInSheet } from "../../subscribers/googleSheets"
import { msgProgressBar } from "../../types/progressBarMsgs"
import { modLinkValues, linkValues, filterOptions } from "../../types/urlToVerify"
import { allSites } from "../../utils/allSites"
import { searchBarConfig } from "../../utils/barUtils"
import { geIdentiflyUrl, delay, genericFilter } from "../../utils/genericUtils"


export const searchMetro =async (linkData:modLinkValues):Promise < modLinkValues | null > => {
  if (linkData.url !== null) {
    const basicInfo = geIdentiflyUrl(linkData.url)
    const returnRedirect: string | null = await checkMetroDB(basicInfo.siteId, basicInfo.storyTitle)
    if (await returnRedirect !== null && allSites[basicInfo.siteId]?.siteProperties?.feedDomainURL !== undefined) {
      if(returnRedirect?.match('/') !== null){
        const urlBase: string =  allSites[basicInfo.siteId].siteProperties.feedDomainURL as string 
        linkData.probableSolution = urlBase + (returnRedirect !== null ? returnRedirect : '')
        linkData.solution = ['redirect']
        linkData.status = 'metro'
        return linkData
      }

    }
  }
  return null
}

export const searchMetroBucle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
    console.log('\nStart to search in Metro DB:')
    const findUrl: modLinkValues[] = []
    if (itemList.length > 0) {
      let key: number = 0
      const progressRevisionOfSearch = searchBarConfig('Search in Metro DB')
      progressRevisionOfSearch.start(itemList.length, 0)
      for (const linkData of itemList) {
        const tempData = await searchMetro(linkData)
        if(tempData!==null){
          findUrl.push(tempData)
          progressRevisionOfSearch.update(key)
          await delay(2000)
        }
        key++
      }
      progressRevisionOfSearch.stop()
    }
    return findUrl
  }

  export const searchAndUpdateMetroInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
        const rowsToSaveInSheet = await searchMetroBucle(rowsOfRedirect)
        if (await rowsToSaveInSheet.length > 0) {
          const barText: msgProgressBar = {
            firstText: 'Update status URL in GoogleSheets',
            lastText: 'Url encontradas.'
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