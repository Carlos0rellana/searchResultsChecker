import axios from 'axios'
import * as access from '../config/tokenAccessArc.json'

export const getAuthorData = async (authorId: string, slug: boolean = false): Promise<any> => {
  const data = ''
  const type = !slug ? '_id' : 'slug'
  const config = {
    method: 'get',
    url: `https://api.metroworldnews.arcpublishing.com/author/v1/author-service/?${type}=${authorId}`,
    headers: {
      Authorization: access.token
    },
    data: data
  }

  axios(config)
    .then(function (response) {
      return response.data
    })
    .catch(function (error) {
      return { error }
    })
}
