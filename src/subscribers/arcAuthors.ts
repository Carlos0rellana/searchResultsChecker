import { getDataFromArc } from '../models/getDataFromArc'

export const getAuthorData = async (authorId: string, slug: boolean = false): Promise<any> => {
  const type = !slug ? '_id' : 'slug'
  return await getDataFromArc(`/author/v1/author-service/?${type}=${authorId}`)
    .then(function (response) {
      return response.data
    })
    .catch(function (error) {
      return { error }
    })
}
