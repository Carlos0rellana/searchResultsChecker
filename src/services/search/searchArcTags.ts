import { validateTagBySlug } from "../../subscribers/arcTags"
import { accessToGoogleSheets, updateRowLinkValues} from "../../subscribers/googleSheets"
import { modLinkValues, linkValues, filterOptions } from "../../types/urlToVerify"
import { searchBarConfig } from "../../utils/barUtils"
import { genericFilter, fetchData } from "../../utils/genericUtils"


export const searchTag = async (tagItem: modLinkValues, forced:boolean): Promise<modLinkValues|null> => {
  if (tagItem.url !== null) {
    let tagSlug: string
    if (tagItem.url.match(/\/tags?\//) !== null) {
      tagSlug = tagItem.url.split(/\/tags?\//)[1]
    } else {
      tagSlug = new URL(tagItem.url).pathname.split('/')[1]
    }
    tagSlug = tagSlug.match(/\//) !== null ? tagSlug.split('/')[0] : tagSlug
    if (await validateTagBySlug(tagSlug)) {
      tagItem.solution = ['redirect']
      tagItem.probableSolution = `/tag/${tagSlug}`
      tagItem.typeOfUrl='tag'
      tagItem.status = 'process'
      return tagItem
    } else if(forced===true){
      tagItem.solution = ['create']
      tagItem.probableSolution = tagSlug
      tagItem.typeOfUrl='tag'
      tagItem.status = 'process'
      return tagItem
    }
  }
  return null
}

export const searchTagsInArcBucle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Arc:')
  const findTags: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = searchBarConfig('Search Tags in Arc')
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const tagItem of itemList) {
      const temp = await searchTag(tagItem,false)
      if (temp !== null) {
        findTags.push(temp)
      }
      key++
      progressRevisionOfSearch.update(key)
    }
    progressRevisionOfSearch.stop()
  }
  return findTags
}

export const checkTagsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'tag',
        status: 'waiting-ok'
      }

      const clearTagsList = genericFilter(rows, options)
      if (clearTagsList.length > 0) {
        for (const tagLink of clearTagsList) {
          if (tagLink.url !== null) {
            const checkValues = await fetchData(tagLink.url)
            const currentTagValues = tagLink as linkValues
            if (checkValues.httpStatus !== null &&
                checkValues.httpStatus >= 400 &&
                checkValues.httpStatus < 500) {
              currentTagValues.status = 'manual'
            } else {
              currentTagValues.status = 'ok'
            }
            await updateRowLinkValues(sheetId, 'Output', tagLink.position, currentTagValues)
            urlList.push(currentTagValues)
          }
        }
      }
      return urlList
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}