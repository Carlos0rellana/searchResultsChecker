import { getArticleByUrl } from '../../subscribers/arcArticles'
import { findArcArticle } from '../../types/articleModfly'
import { getSiteIdFromUrl } from '../../utils/genericUtils'

export const searchArticleByRoute = async (route: string): Promise< findArcArticle | null > => {
  const tempUrlObject = new URL(route)
  const siteId = getSiteIdFromUrl(tempUrlObject)
  const response = await getArticleByUrl(siteId, tempUrlObject.pathname, false)
  if (response !== null) {
    return {
      site: siteId,
      path: tempUrlObject.pathname,
      data: response
    }
  }
  return null
}
