import { checkMetroDB } from '../../subscribers/getArticleRedirectFromPublimetroDB'
import { modLinkValues } from '../../types/urlToVerify'
import { allSites } from '../../utils/allSites'
import { searchBarConfig } from '../../utils/barUtils'
import { geIdentiflyUrl, delay } from '../../utils/genericUtils'

export const searchMetro = async (linkData: modLinkValues): Promise < modLinkValues | null > => {
  if (linkData.url !== null) {
    const basicInfo = geIdentiflyUrl(linkData.url)
    const returnRedirect: string | null = await checkMetroDB(basicInfo.siteId, basicInfo.storyTitle)
    if (await returnRedirect !== null && allSites[basicInfo.siteId]?.siteProperties?.feedDomainURL !== undefined) {
      if (returnRedirect?.match('/') !== null) {
        const urlBase: string = allSites[basicInfo.siteId].siteProperties.feedDomainURL as string
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
      if (tempData !== null) {
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
