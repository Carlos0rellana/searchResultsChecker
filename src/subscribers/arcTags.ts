import axios from 'axios'
import * as access from '../config/tokenAccessArc.json'

export const getTagById = async (tagId: string): Promise<boolean> => {
  const config = {
    method: 'get',
    url: `https://api.metroworldnews.arcpublishing.com/tags/v2/slugs?slugs=${tagId}`,
    headers: {
      Authorization: access.token
    }
  }
  return await axios(config)
    .then(function (response) {
      const result = response.data
      if (result?.Payload !== undefined) {
        if (result.Payload.length > 0 && result.Payload[0] !== null) {
          return true
        }
        return false
      } else {
        return false
      }
    })
    .catch(function (error) {
      console.log(error)
      return false
    })
}
