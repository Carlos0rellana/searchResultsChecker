import { searchInBucleArc } from '../../subscribers/arcSearch'
import { arcSimpleStory, modLinkValues } from '../../types/urlToVerify'
import { allSites } from '../../utils/allSites'
import { searchBarConfig } from '../../utils/barUtils'
import { geIdentiflyUrl, delay, noSolution } from '../../utils/genericUtils'

export const searchCirculate = async (linkData: modLinkValues): Promise < modLinkValues > => {
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
  return noSolution(linkData)
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
