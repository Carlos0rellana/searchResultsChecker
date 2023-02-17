import axios from 'axios'
import * as access from '../config/tokenAccessArc.json'
import { SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'
import { arcSimpleStory, typeOfLink } from '../types/urlToVerify'
import { ratioElementsOptions, searchInArcItemOptions } from '../types/config'
import { ratioWords } from '../utils/genericUtils'
import { getAsyncWebGrammarly, getAListOfPossiblesTitles } from '../subscribers/grammarly'

const searchInArc = async (siteId: string, searchQuery: string, from: string = '0', size: string = '100'): Promise<string> => {
  const returnValues = '_id,website_url,websites,canonical_url,headlines.basic,type'
  const config = {
    method: 'get',
    url: `https://api.metroworldnews.arcpublishing.com/content/v4/search/published?website=${siteId}&q=${searchQuery}&_sourceInclude=${returnValues}&from=${from}&size=${size}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: access.token
    }
  }

  console.log(`https://api.metroworldnews.arcpublishing.com/content/v4/search/published?\nwebsite=${siteId}&q=${searchQuery}&_sourceInclude=${returnValues}&from=${from}&size=${size}`)

  let query = null
  let iteraciones = 0
  while (query == null) {
    if (iteraciones > 10) {
      return 'fail'
    }
    query = await getData(config)
    iteraciones++
  }

  const result = query.data
  if (result.content_elements !== undefined && result.content_elements.length > 0) {
    console.log('\n========\n', result, '\n========\n')
    return result
  } else if (result.error_code !== undefined) {
    return 'fail'
  } else {
    return 'fail'
  }
}

const getData = async (config: any): Promise<any|null> => {
  try {
    const result = await axios(config)
    return result
  } catch (err: any) {
    console.log(err)
    return null
  }
}

const reverseSearch = async (siteId: string, search: string, compareOrder: string[]): Promise <any|null> => {
  const searchQuery = `canonical_url:*${search}*`
  if (siteId === compareOrder[0]) {
    const find = searchInArc(siteId, searchQuery)
    if (await find === 'fail') {
      return await searchInArc(compareOrder[1], searchQuery)
    }
    return await find
  }
  return null
}

const searchByTitle = async (siteId: string, element: arcSimpleStory): Promise<arcSimpleStory|false> => {
  // const title = getAsyncWebGrammarly(element.title.replace(/:/g, '\\:').replace(/"/g, '\\"'))
  let title: string = element.title
  title = title.replace(/[:“”#\\]/g, '')
  const searchQuery = `headlines.basic:"${title}"+AND+type:"story"`
  console.log('searchQuery', searchQuery)
  const data: any = await searchInArc(siteId, searchQuery)
  if (data !== 'fail') {
    const result: any = restructureAarcSimpleStory(siteId, data.content_elements[0])
    return result
  }
  return false
}

const restructureAarcSimpleStory = (siteId: string, searchResult: any): arcSimpleStory => {
  let titleFromInput = 'No title, because is a redirect'
  if (searchResult._id.match(/_redirect_/) === null &&
     searchResult?.headlines?.basic !== undefined) {
    titleFromInput = searchResult.headlines.basic
  }
  const currentUrl: arcSimpleStory = {
    url: searchResult.canonical_url,
    site: siteId,
    id: searchResult._id,
    type: searchResult.type as typeOfLink,
    title: titleFromInput,
    isTitleByIteration: false
  }
  return currentUrl
}

const comparativeResult = (resultList: any, config: ratioElementsOptions, ratio: number = 0.8): [number, arcSimpleStory]|false => {
  let returnValue: [number, arcSimpleStory]|false = false
  if (resultList.content_elements !== undefined) {
    for (const element of resultList.content_elements) {
      if (element.canonical_url !== undefined) {
        const ratioValue = ratioWords(element.canonical_url, config)
        console.log('ratioValue', ratioValue)
        if (returnValue === false && ratioValue >= ratio) {
          const currentUrl = restructureAarcSimpleStory(config.siteId, element)
          returnValue = [ratioValue, currentUrl]
        }
        if (returnValue !== false && ratioValue > returnValue[0]) {
          const currentUrl = restructureAarcSimpleStory(config.siteId, element)
          returnValue = [ratioValue, currentUrl]
        }
      }
    }
  }
  return returnValue
}

const lookingForASite = async (searchConfig: searchInArcItemOptions): Promise <arcSimpleStory|false> => {
  let mainSiteSearch: any = await searchInArc(searchConfig.siteId, searchConfig.search)
  let currentUrl: arcSimpleStory
  console.log('\n<////////////>\ninit search in Arc\n<////////////>\n')
  if (mainSiteSearch === undefined || mainSiteSearch.message === 'fail') {
    mainSiteSearch = await lookingForASite(searchConfig)
  }
  if (mainSiteSearch.count !== undefined && mainSiteSearch.count > 0) {
    const config: ratioElementsOptions = {
      type: searchConfig.type,
      siteId: searchConfig.siteId,
      valueToSearch: searchConfig.search
    }
    const checkingItem = comparativeResult(mainSiteSearch, config)
    if ((checkingItem !== false && checkingItem.length > 0) || (checkingItem !== false && searchConfig.search.match('headlines.basic') !== null)) {
      currentUrl = checkingItem[1]
      console.log('\n<////////////>\nend search in Arc\n<////////////>\n')
      return currentUrl
    }
  }
  console.log(false)
  console.log('\n<////////////>\nend search in Arc\n<////////////>\n')
  return false
}

const bucleSeachByTitleInSitesList = async (siteId: string, search: arcSimpleStory): Promise<arcSimpleStory|false> => {
  const allSites: SitesList = sitesData as SitesList
  const idListSites = Object.keys(allSites)
  let find: arcSimpleStory | false = false
  for (const localIdSite of idListSites) {
    if (localIdSite !== 'mwnbrasil' && localIdSite !== 'novamulher' && localIdSite !== siteId) {
      // const title = getAsyncWebGrammarly(search.title.replace(/:/g, '\\:').replace(/"/g, '\\"'))
      const title = getAsyncWebGrammarly(search.title)
      search.title = title.mod
      find = await searchByTitle(localIdSite, search)
      if (await find !== false) {
        return find
      }
    }
  }
  return find
}

const bucleSeachInSitesList = async (siteId: string, search: string, currentPriority: typeOfLink|false = false): Promise<arcSimpleStory|false> => {
  const allSites: SitesList = sitesData as SitesList
  const idListSites = Object.keys(allSites)
  let find: arcSimpleStory | false = false
  for (const localIdSite of idListSites) {
    console.log(`Buscando en el Sitio: ${localIdSite}`)
    if (localIdSite !== 'mwnbrasil' && localIdSite !== 'novamulher' && localIdSite !== siteId) {
      const searchQuery = `canonical_url:*${search}*`
      const searchConfig: searchInArcItemOptions = {
        siteId: localIdSite,
        search: searchQuery,
        type: 'url',
        priority: currentPriority
      }
      find = await lookingForASite(searchConfig)
      console.log('\nCheck In Site=========>\n', await find, '\n<=========\n')
      if (await find !== false) {
        return find
      }
    }
  }
  return find
}

export const searchInBucleArc = async (siteId: string, search: string, currentPriority: typeOfLink|false = false): Promise <arcSimpleStory|false> => {
  let find: arcSimpleStory|false = false
  if (siteId === 'mwnbrasil' || siteId === 'novamulher') {
    const compareList = siteId === 'mwnbrasil' ? ['mwnbrasil', 'novamulher'] : ['novamulher', 'mwnbrasil']
    find = await reverseSearch(siteId, search, compareList)
  } else {
    const searchQuery = `canonical_url:*${search}*`
    const searchConfig: searchInArcItemOptions = {
      siteId: siteId,
      search: searchQuery,
      type: 'url',
      priority: currentPriority
    }
    find = await lookingForASite(searchConfig)
    if (find === false) {
      find = await bucleSeachInSitesList(siteId, search, currentPriority)
    }
  }
  if (find !== false && currentPriority === false && (find?.type === 'gallery' || find?.type === 'video' || find.site !== siteId)) {
    const checkByTitle = await searchByTitle(siteId, find)
    if (checkByTitle !== false) {
      return checkByTitle
    } else {
      const returnValue = await bucleSeachByTitleInSitesList(siteId, find)
      return returnValue
    }
  }
  if (find === false) {
    const title = search.replace(/-/g, ' ')
    const generaTitulos = getAListOfPossiblesTitles(title)
    for (let x = 0; x < generaTitulos.result.length; x++) {
      const titulo: string = generaTitulos.result[x]
      const input = {
        headlines: { basic: titulo },
        canonical_url: 'no url',
        site: siteId,
        _id: 'no existe',
        type: 'story'
      }
      const element = restructureAarcSimpleStory(siteId, input)
      find = await searchByTitle(siteId, element)
      if (find !== false) {
        find.isTitleByIteration = true
        return find
      }
    }
  }
  return find
}
