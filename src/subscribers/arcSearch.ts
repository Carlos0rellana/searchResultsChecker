import axios from 'axios'
import * as access from '../config/tokenAccessArc.json'
import { SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'
import { arcSimpleStory, typeOfLink } from '../types/urlToVerify'
import { ratioElementsOptions, searchInArcItemOptions } from '../types/config'
import { ratioWords } from '../utils/generic_utils'

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

  console.log(`\nhttps://api.metroworldnews.arcpublishing.com/content/v4/search/published?website=${siteId}&q=${searchQuery}\n&_sourceInclude=${returnValues}&from=${from}&size=${size}`)

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
  if (result.content_elements !== undefined) {
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
  console.log('function searchByTitle')
  const searchQuery = `headlines.basic:"${element.title.replace(/:/g, '\\:').replace(/"/g, '\\"')}"+AND+type:"story"`
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
    title: titleFromInput
  }
  return currentUrl
}

const comparativeResult = (resultList: any, config: ratioElementsOptions, ratio: number = 0.8): [number, arcSimpleStory]|false => {
  console.log('function comparativeResult')
  let returnValue: [number, arcSimpleStory]|false = false
  if (resultList.content_elements !== undefined) {
    console.log('Linea 102')
    for (const element of resultList.content_elements) {
      if (element.canonical_url !== undefined) {
        console.log('Linea 105')
        const ratioValue = ratioWords(element.canonical_url, config)
        console.log('ratioValue', ratioValue)
        if (returnValue === false && ratioValue >= ratio) {
          console.log('Linea 109')
          const currentUrl = restructureAarcSimpleStory(config.siteId, element)
          returnValue = [ratioValue, currentUrl]
        }

        if (returnValue !== false && ratioValue > returnValue[0]) {
          console.log('Linea 115')
          const currentUrl = restructureAarcSimpleStory(config.siteId, element)
          returnValue = [ratioValue, currentUrl]
        }
      }
    }
  }
  return returnValue
}

const lookingForASite = async (searchConfig: searchInArcItemOptions): Promise <arcSimpleStory|false> => {
  console.log('function lookingForASite')
  let mainSiteSearch: any = await searchInArc(searchConfig.siteId, searchConfig.search)
  let currentUrl: arcSimpleStory
  console.log('\n<////////////>\ninit search in Arc\n<////////////>\n')
  if (mainSiteSearch === undefined || mainSiteSearch.message === 'fail') {
    console.log('Line 126')
    mainSiteSearch = await lookingForASite(searchConfig)
  }
  if (mainSiteSearch.count !== undefined && mainSiteSearch.count > 0) {
    console.log('Line 130')
    const config: ratioElementsOptions = {
      type: searchConfig.type,
      siteId: searchConfig.siteId,
      valueToSearch: searchConfig.search
    }
    console.log('ratioElementsOptions', config)
    const checkingItem = comparativeResult(mainSiteSearch, config)
    console.log('checkingItem', checkingItem)
    if ((checkingItem !== false && checkingItem.length > 0) || (checkingItem !== false && searchConfig.search.match('headlines.basic') !== null)) {
      console.log('Line 138')
      currentUrl = checkingItem[1]
      console.log(currentUrl)
      console.log('\n<////////////>\nend search in Arc\n<////////////>\n')
      return currentUrl
    }
  }
  console.log('Line 145')
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
    console.log('Linea 211', find)
    if (await find === false) {
      find = await bucleSeachInSitesList(siteId, search, currentPriority)
    }
  }
  // console.log(`\n\n Resultado de SearchBubleArc`);
  // console.log(find);

  // if(find !== false && find?.type === 'redirect'){
  //   console.log('Es un Redirect');
  //   const returnValues = '_id,website_url,websites,canonical_url,headlines.basic,type'
  //   const config = {
  //     method: 'get',
  //     url: `https://api.metroworldnews.arcpublishing.com/content/v4/search/published?website=${siteId}&q=${searchQuery}&_sourceInclude=${returnValues}&from=${from}&size=${size}`,
  //     headers: {
  //       'Content-Type': 'application/json',
  //       Authorization: access.token
  //     }
  //   }
  // }
  if (find !== false && currentPriority === false && (await find?.type === 'gallery' || await find?.type === 'video')) {
    console.log('Gallery Found')
    const checkByTitle = await searchByTitle(siteId, find)
    if (checkByTitle !== false) {
      return checkByTitle
    } else {
      const returnValue = await bucleSeachByTitleInSitesList(siteId, find)
      return returnValue
    }
  }
  return find
}
