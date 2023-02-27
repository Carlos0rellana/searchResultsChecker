import axios from 'axios'
import * as access from '../config/tokenAccessArc.json'

export const getTagBySlug = async (tagId: string): Promise<boolean> => {
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
      if (result?.Payload !== undefined && result?.Payload.length > 0 && result?.Payload[0] !== null) {
        return true
      }
      return false
    })
    .catch(function (error) {
      console.log(error)
      return false
    })
}

export const makeAtagByslug = async (slugTag: string): Promise<any> => {
  const data = JSON.stringify([
    {
      slug: slugTag
    }
  ])

  const config = {
    method: 'post',
    url: 'https://api.metroworldnews.arcpublishing.com/tags/add/',
    headers: {
      Authorization: access.token,
      'Content-Type': 'application/json'
    },
    data: data
  }

  return await axios(config)
    .then(function (_response) {
      // console.log(JSON.stringify(response.data))
      return true
    })
    .catch(function (_error) {
      // console.log(error)
      return false
    })
}
