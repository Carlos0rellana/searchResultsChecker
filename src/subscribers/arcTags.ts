import { createInArc } from '../models/addDataFromArc'
import { getDataFromArc } from '../models/getDataFromArc'
import { minimalTag } from '../types/tags'

export const getTagBySlug = async (tagId: string): Promise<minimalTag|null> => {
  return await getDataFromArc(`/tags/v2/slugs?slugs=${tagId}`)
    .then(function (response) {
      const result = response.data
      if (result?.Payload !== undefined && result?.Payload.length > 0 && result?.Payload[0] !== null) {
        const value = result.Payload[0]
        if (value?.slug !== 'undefined') {
          return {
            slug: value.slug ?? '',
            description: value.description ?? '',
            text: value.name ?? ''
          }
        }
      }
      return null
    })
    .catch(function (error) {
      console.log(error)
      return null
    })
}

export const validateTagBySlug = async (tagId: string): Promise<boolean> => {
  return await getDataFromArc(`/tags/v2/slugs?slugs=${tagId}`)
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
  const data = JSON.stringify([{ slug: slugTag }])
  return await createInArc('/tags/add/', data)
    .then(function (_response) {
      return true
    })
    .catch(function (_error) {
      return false
    })
}
