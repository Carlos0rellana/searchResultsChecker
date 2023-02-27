import colors from 'ansi-colors'
import axios, { AxiosError } from 'axios'

import sitesData from '../config/static_data/blocks.json'
import { identitySearch } from '../types/sites'
import { ratioElementsOptions } from '../types/config'

import { linkValues, filterOptions, typeOfLink, modLinkValues, method, statusCheck } from '../types/urlToVerify'
import { settingBar } from './barUtils'

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

const rudimentaryUrlDistribution = async (url: string): Promise<typeOfLink> => {
  const pathRoute = new URL(url).pathname
  const lengthPath = pathRoute.replace(/^\//,'').replace(/\/$/, '').split('/').length
  
  if(lengthPath === 1){
    return 'rare'
  }else if(pathRoute.match(/\/categor(y|ia)\//) !== null){
    return 'section'
  }else if (pathRoute.match(/\/tags?\//g) != null) {
    return 'tag'
  } else if (pathRoute.match(/videos?/) !== null) {
    return 'video'
  } else if (pathRoute.match(/\/buscador\//) !== null) {
    return 'search'
  } else if ((pathRoute.match(/galerias?|fotos?/) != null)) {
    return 'gallery'
  } else if (pathRoute.match(/\/auth?or(es)?\/?/) != null) {
    return 'author'
  } else if (pathRoute.includes('.png') || pathRoute.includes('.xml') || pathRoute.includes('.jpeg') || pathRoute.includes('.jpg')) {
    return 'file'
  } else {
    return 'story'
  }
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

export const genericFilter = (itemList: string[][]|null, options: filterOptions): modLinkValues[] => {
  const result: modLinkValues[] = []
  if (itemList !== null && itemList.length > 0) {
    let key = 0
    const barConfig = {
      colorConfig: colors.bgCyan,
      firstText: `Filter by ${options.type}`,
      lastText: `${options.type} URL checkeds`
    }
    const progressRevisionOfSearch = settingBar(barConfig)
    console.log(`\nStart to filter by ${options.type}:`)
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const info of itemList) {
      const linkData: modLinkValues = getSimpleLinkValues(info, key)
      const checkingType = options.type === 'any' ? (linkData.typeOfUrl === 'gallery' || linkData.typeOfUrl === 'story' || linkData.typeOfUrl === 'video' || linkData.typeOfUrl === 'search' || linkData.typeOfUrl === 'rare' ) : linkData.typeOfUrl === options.type
      if (linkData.httpStatus !== null &&
          (options.method === null || linkData.solution?.includes(options.method) === true) &&
          linkData.httpStatus < options.httpStatus + 99 &&
          linkData.httpStatus >= options.httpStatus &&
          linkData.status === options.status &&
          checkingType) {
        result.push(linkData)
      }
      key++
      progressRevisionOfSearch.update(key)
    }
    progressRevisionOfSearch.stop()
  }
  return result
}

export const ratioWords = (variableUrl: string, item: ratioElementsOptions): number => {
  type ObjectKey = keyof typeof sitesData

  const splitConfig = item.type === 'url' ? '-' : ' '
  let countWords = 0

  const urlCompleta = `${sitesData[item.siteId as ObjectKey].siteProperties.feedDomainURL} ${variableUrl}`
  const urlArc = geIdentiflyUrl(urlCompleta)
  const searchWordsInUrl = item.valueToSearch.split(splitConfig)
  const urlWordsToCompare = urlArc.storyTitle.split(splitConfig)
  for (const element of searchWordsInUrl) {
    if (urlWordsToCompare.includes(element.replace(/\*/gi, '').replace('canonical_url:', ''))) {
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
  let hostRoute = formatToUrl.hostname.replace(/(origin|touch|dev|showbiz|juegos|mov)./, 'www.')
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
    const validateUrl = sanitizePathToWWWWpath(url)
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
      currentData.typeOfUrl = await rudimentaryUrlDistribution(url)
    }
    return currentData
  }
}
