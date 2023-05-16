import { createInArc } from '../models/addDataFromArc'
import { updateInArc } from '../models/modDataFromArc'
import { articleModifly } from '../types/articleModfly'

export const updateDraftArticle = async (story: articleModifly): Promise < any | null > => {
  const stringQuery = `/draft/v1/story/${story.id}/revision/draft`
  const data = { ans: story.data }
  return await updateInArc(stringQuery, data)
    .then(function (response) {
      return response.data
    })
    .catch(function (error) {
      console.log('Error en updateDraftArticle====>', error)
      return null
    })
}

export const publishDraftArticle = async (storyId: string): Promise < any | null > => {
  const stringQuery = `/draft/v1/story/${storyId}/revision/published`
  return await createInArc(stringQuery)
    .then(function (response) {
      return response.data
    })
    .catch(function (error) {
      console.log('Error en publishDraftArticle====>', error)
      return null
    })
}
