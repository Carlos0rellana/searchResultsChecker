import { searchInBucleArc } from "../../subscribers/arcSearch"
import { accessToGoogleSheets, updateAgroupOfValuesInSheet } from "../../subscribers/googleSheets"
import { msgProgressBar } from "../../types/progressBarMsgs"
import { arcSimpleStory, filterOptions, linkValues, modLinkValues } from "../../types/urlToVerify"
import { allSites } from "../../utils/allSites"
import { searchBarConfig } from "../../utils/barUtils"
import { geIdentiflyUrl, delay, genericFilter } from "../../utils/genericUtils"


export const searchCirculate =async (linkData:modLinkValues):Promise < modLinkValues | null > => {
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
      return linkData
    }
  }
  return null  
} 

export const searchInArcCirculate = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
    console.log('\nStart to search in Arc Sites:')
    const findUrl: modLinkValues[] = []
    if (itemList.length > 0) {
      let key: number = 0
      const progressRevisionOfSearch = searchBarConfig('Search in Arc Sites')
  
      progressRevisionOfSearch.start(itemList.length, 0)
      for (const linkData of itemList) {
        const tempData = await searchCirculate(linkData)
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

export const searchAndUpdateCirculateInSheets = async (sheetId: string): Promise<linkValues[]|null> => {
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
            firstText: 'Update status URL in GoogleSheets',
            lastText: 'Url encontradas en sitios de Arc.'
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