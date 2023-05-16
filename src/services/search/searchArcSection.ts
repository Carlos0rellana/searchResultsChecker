import { getCategoryById } from '../../subscribers/arcHierarchy'
import { modLinkValues } from '../../types/urlToVerify'
import { getSiteIdFromUrl } from '../../utils/genericUtils'

export const searchSection = async (sectionItem: modLinkValues): Promise < modLinkValues| null > => {
  if (sectionItem.url !== null) {
    let sectionId: string | null = null
    const URI = new URL(sectionItem.url)
    const siteId = getSiteIdFromUrl(URI)
    if (sectionItem.url.match(/\/categor(y|ia)\//) !== null) {
      sectionId = `/${sectionItem.url.split(/\/categor(y|ia)\//)[1]}`
    } else {
      sectionId = (URI.pathname).replace(/\/$/, '')
    }
    if (sectionId !== null && await getCategoryById(siteId, sectionId)) {
      sectionItem.solution = ['redirect']
      sectionItem.probableSolution = sectionId
      sectionItem.typeOfUrl = 'section'
      sectionItem.status = 'process'
      return sectionItem
    }
  }
  return null
}
