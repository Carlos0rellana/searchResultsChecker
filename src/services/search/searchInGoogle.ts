import { searchInGoogleServiceApi } from "../../subscribers/googleApiSearch"
import { accessToGoogleSheets, updateRowLinkValues } from "../../subscribers/googleSheets"
import { identitySearch } from "../../types/sites"
import { modLinkValues, linkValues } from "../../types/urlToVerify"
import { allSites } from "../../utils/allSites"
import { searchBarConfig, checkBarConfig } from "../../utils/barUtils"
import { geIdentiflyUrl, delay, getSimpleLinkValues} from "../../utils/genericUtils"


export const searchInGoogle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
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
              const urlSite = allSites[urlClear.siteId].siteProperties.feedDomainURL
              if (urlSite !== null && urlSite !== undefined) {
                const googleSearch = await searchInGoogleServiceApi(urlClear.siteId, urlClear.storyTitle)
                if (googleSearch !== null) {
                  rowData.probableSolution = googleSearch
                  rowData.solution = ['redirect']
                  rowData.status = 'google'
                  currentListModValues.push(rowData)
                  const linkData = rowData as linkValues
                  await updateRowLinkValues(sheetId, 'Output', rowData.position, linkData)
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