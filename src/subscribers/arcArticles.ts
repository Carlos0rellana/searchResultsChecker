import { getDataFromArc } from '../models/getDataFromArc'

export const getArticleByUrl = async (siteId: string, storyPath: string, published: boolean = true): Promise < any | null > => {
  const stringQuery = `/content/v4/stories/?website=${siteId}&website_url=${storyPath}&published=${String(published)}`
  return await getDataFromArc(stringQuery)
    .then(function (response) {
      return response.data
    })
    .catch(function (_error) {
      // console.log('Error en getArticleByUrl====>',_error,'\n/////////\n',stringQuery)
      return null
    })
}
