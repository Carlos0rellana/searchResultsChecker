import { getDataFromArc } from '../models/getDataFromArc'

export const getCategoryById = async (siteId:string,categoryId: string): Promise<boolean> => {
  return await getDataFromArc(`/site/v3/website/${siteId}/section/?_id=${categoryId}`)
    .then(function (response) {
      const result = response.data
      if (result?._id !== undefined && result?._id !== null ) {
        return true
      }
      return false
    })
    .catch(function (_error) {
      return false
    })
}