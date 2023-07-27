import { linkValues, modLinkValues } from '../../types/urlToVerify';
import { fetchData, noSolution } from '../../utils/genericUtils'
import { searchCirculate } from './searchArcCirculate'
import { searchRedirect } from './searchArcRedirects'
import { searchSection } from './searchArcSection'
import { searchSitemaps } from './searchArcSitemaps'
import { searchTag } from './searchArcTags'
import { searchMetro } from './searchMetroDb'



export const searchPosibilities = async (linkData: modLinkValues): Promise < modLinkValues | null > => {
  if (linkData.url !== null && linkData.status === 'none') {
    switch (linkData.typeOfUrl) {
      case 'search':
        linkData.probableSolution = '/buscador/';
        return linkData
      case 'tag' :
        return await searchTag(linkData, true)
      case 'rare':
      case 'section':
        return (await searchSection(linkData) ?? await searchTag(linkData, false) ?? await searchMetro(linkData))
      case 'redirect':
      case 'story':
      case 'video':
      case 'gallery':
      case 'any':
        return (await searchRedirect(linkData) ?? await searchSitemaps(linkData) ?? await searchMetro(linkData) ?? await searchCirculate(linkData))
      default:
        return noSolution(linkData) 
    }
  }
  return null
}

export const searchPosibilitiesBucle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search:')
  const tempArrayLinks: modLinkValues[] = []
  if (itemList.length > 0) {
    for (const item of itemList) {
      const tempData = await searchPosibilities(item)
      if (tempData !== null) {
        tempArrayLinks.push(tempData)
      }
    }
  }
  return tempArrayLinks
}

export const searchByUrl = async (url: string): Promise < linkValues > => {
  const tempData: modLinkValues = await fetchData(url) as modLinkValues
  tempData.position = 0
  const result = await searchPosibilities(tempData) as linkValues
  return result ?? tempData
}
