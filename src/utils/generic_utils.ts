import { linkValues, typeOfLink, modLinkValues, method, statusCheck } from '../types/urlToVerify'
import axios, { AxiosError } from 'axios'
import sitesData from '../config/static_data/blocks.json'
import { identitySearch } from '../types/sites'
import { ratioElementsOptions } from '../types/config'

const getGlobalContetType = (check: string): typeOfLink | null => {
  const find = 'Fusion.globalContent='
  if (check.includes(find)) {
    const secondFind = ';'
    const firstStep = check.split(find)[1]
    if (firstStep.includes(secondFind)) {
      const globalContent = JSON.parse(firstStep.split(secondFind)[0])
      if ('type' in globalContent) {
        return globalContent.type
      } else if ('node_type' in globalContent) {
        return globalContent.node_type
      } else if ('authors' in globalContent) {
        return 'author'
      } else if ('Payload' in globalContent) {
        return 'tag'
      } else {
        return globalContent
      }
    } else {
      return null
    }
  } else {
    return null
  }
}

const rudimentaryUrlDistribution = (url: string): typeOfLink => {
  if (url.match(/\/tags?\//g) != null) {
    return 'tag'
  } else if (url.match(/videos?/) !== null) {
    return 'video'
  } else if (url.match(/\/buscador\//) !== null) {
    return 'search'
  } else if ((url.match(/galerias?/) != null) || (url.match(/fotos?/) != null)) {
    return 'gallery'
  } else if (url.match(/\/autor(es)?/) != null || url.match(/\/author\//) != null) {
    return 'author'
  } else if (url.includes('.png') || url.includes('.xml') || url.includes('.jpeg') || url.includes('.jpg')) {
    return 'file'
  } else {
    return 'story'
  }
}

const urlFormating = (url: string): string | null => {
  // const currentUrl = allSites[websiteId].siteProperties.feedDomainURL
  const crossWeb = 'https://www'
  if (url.includes('https://touch.')) {
    return crossWeb + url.slice(13)
  }
  if (url.includes('http://touch.')) {
    return crossWeb + url.slice(12)
  }
  if (url.includes('https://origin.')) {
    return crossWeb + url.slice(14)
  }
  if (url.includes('http://origin.')) {
    return crossWeb + url.slice(13)
  }
  return null
}

const getOutputTypeFromUrl = (url: string): string => {
  let outputType = 'default'
  if (url.includes('outputType')) {
    const urlFragments = url.split('/').pop()
    if (urlFragments !== undefined) {
      const params = urlFragments.split('?')[1].split('&')
      params.map((value) => {
        if (value.includes('outputType')) {
          outputType = value.replace('outputType', '').replace('?', '').replace('=', '').replace('"', '')
        }
        return outputType
      })
    }
  }
  return outputType
}

export const ratioWords = (variableUrl: string, item: ratioElementsOptions): number => {
  const splitConfig = item.type === 'url' ? '-' : ' '
  let countWords = 0
  const searchWordsInUrl = item.valueToSearch.split(splitConfig)
  const urlWordsToCompare = variableUrl.split(splitConfig)
  for (const element of searchWordsInUrl) {
    if (urlWordsToCompare.includes(element)) {
      countWords++
    }
  }

  return (countWords / searchWordsInUrl.length)
}

export const delay = async (ms: number): Promise<any> => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

export const sanitizePathToWWWWpath = (url: string, protocol: string|null = null): string => {
  const formatToUrl = new URL(url)
  let hostRoute = formatToUrl.hostname.replace('origin.', 'www.').replace('touch.', 'www.').replace('dev.', 'www.').replace('showbiz.', 'www.').replace('juegos.', 'www.').replace('mov.', 'www.')
  if (hostRoute.match('www.') === null) {
    hostRoute = `www.${hostRoute}`
  }
  const pre = protocol === null ? 'https://' : protocol
  return (pre + hostRoute + formatToUrl.pathname)
}

export const geIdentiflyUrl = (url: string): identitySearch => {
  const site: identitySearch = {
    siteId: '',
    storyTitle: ''
  }
  url = sanitizePathToWWWWpath(url)
  const URI = new URL(url)
  const segmentedUrl = URI.pathname.split('/')
  const roxen = /\/[\w]*\b!\b[\w]*\//
  const galeria = /\/galeria\/$/
  const video = /\/video\/$/
  const attachment = /\/attachment\/(.*)?\/?$/
  Object.entries(sitesData).forEach((element) => {
    const currenturl = element[1].siteProperties.feedDomainURL
    if (`${URI.protocol}//${URI.hostname}` === currenturl) {
      site.siteId = element[0]
    }
  })
  if (URI.pathname.match(/^\/autor\//) != null) {
    site.storyTitle = segmentedUrl[1]
  } else if (URI.pathname.match(attachment) != null) {
    const stepOne = URI.pathname.split('/attachment/')[0]
    const stepTwo = stepOne.split('/')
    site.storyTitle = stepTwo[stepTwo.length - 1]
  } else if ((URI.pathname.match(roxen) != null) || (URI.pathname.match(video) != null) || (URI.pathname.match(galeria) != null)) {
    site.storyTitle = segmentedUrl[segmentedUrl.length - 3]
  } else if (URI.pathname.match(/\/$/) !== null) {
    site.storyTitle = segmentedUrl[segmentedUrl.length - 2]
  } else {
    site.storyTitle = segmentedUrl[segmentedUrl.length - 1]
  }
  site.storyTitle = site.storyTitle.replace(/.html$/, '')
  if (site.siteId === '') {
    console.log('This fail =====>', url)
  }
  return site
}

export const simpleRowData = async (lists: string[][]|null, showCellName: string): Promise<string[]|null> => {
  if (lists !== null && lists.length > 0) {
    const currentSimpleList: string[] = []
    let find = false
    let position = 0
    lists[0].forEach((value, index) => {
      if (value === showCellName) {
        position = index
        find = true
      }
    })
    if (find) {
      lists.forEach((row, index) => {
        if (index !== 0) {
          currentSimpleList.push(row[position])
        }
      })
      return currentSimpleList
    }
    return null
  }
  return null
}

export const getSimpleLinkValues = (row: string[], key: number): modLinkValues => {
  return {
    url: row[0],
    httpStatus: Number(row[1]),
    typeOfUrl: row[2] as typeOfLink | null,
    outputType: row[3],
    probableSolution: row[4],
    solution: row[5].split(',') as method[],
    status: row[6] as statusCheck,
    position: key + 1
  }
}

export const fetchData = async (url: string): Promise<linkValues> => {
  const currentData: linkValues = {
    url: url,
    httpStatus: null,
    typeOfUrl: null,
    outputType: getOutputTypeFromUrl(url),
    probableSolution: null,
    solution: null,
    status: 'none'
  }
  try {
    const validateUrl = urlFormating(url)
    let currentUrl = url
    if (validateUrl !== null) {
      currentUrl = validateUrl
      currentData.probableSolution = validateUrl
    }
    const urlInfo = await axios.get(currentUrl)
    if ('status' in urlInfo) {
      currentData.httpStatus = urlInfo.status
      if (urlInfo.status < 400) {
        currentData.status = 'ok'
      }
      if (currentData.outputType === 'default') {
        const check = urlInfo.data
        currentData.typeOfUrl = getGlobalContetType(check)
      } else {
        const tempUrl = url.replace('outputType=amp', '')
        const tempData = await fetchData(tempUrl)
        if (tempData !== null) {
          currentData.typeOfUrl = tempData.typeOfUrl
        }
      }
    }
    return currentData
  } catch (error) {
    const err = error as AxiosError
    if (err.response != null && err.response !== undefined) {
      currentData.httpStatus = err.response.status
      currentData.typeOfUrl = rudimentaryUrlDistribution(url)
    }
    return currentData
  }
}
