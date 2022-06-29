import { linkValues, typeOfLink } from '../types/urlToVerify'
import axios, { AxiosError } from 'axios'

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
  if (url.includes('tag') || url.includes('tags')) {
    return 'tag'
  } else if (url.includes('video') || url.includes('videos')) {
    return 'video'
  } else if (url.includes('galeria') || url.includes('galerias') || url.includes('foto')) {
    return 'gallery'
  } else if (url.includes('/autor') || url.includes('/autores')) {
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
  if (url.includes('https://origin.')) {
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

export const fetchData = async (url: string): Promise<linkValues> => {
  const currentData: linkValues = {
    url: url,
    httpStatus: null,
    typeOfUrl: null,
    outputType: getOutputTypeFromUrl(url),
    problemLists: null,
    possibleSolution: null,
    status: 'none'
  }
  try {
    const validateUrl = urlFormating(url)
    console.log(validateUrl)
    let currentUrl = url
    if (validateUrl !== null) {
      currentUrl = validateUrl
      currentData.possibleSolution = validateUrl
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
