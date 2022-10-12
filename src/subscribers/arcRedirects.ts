import axios, { AxiosRequestConfig } from 'axios'
import * as access from '../config/tokenAccessArc.json'

import { SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'

const allSites: SitesList = sitesData as SitesList

const axiosConfig = (siteId: string, url: string, data: string = '', method: string = 'get'): AxiosRequestConfig => {
  const hostName = allSites[siteId]?.siteProperties.feedDomainURL
  if (hostName !== undefined && url.includes(hostName)) {
    const currentPath = new URL(url)
    url = currentPath.pathname
  }
  return {
    method: method,
    url: `https://api.metroworldnews.arcpublishing.com/draft/v1/redirect/${siteId}/${url}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: access.token
    },
    data: data
  }
}

export const makeRedirect = async (siteId: string, urlToFrom: string, urlToGo: string): Promise<false|string> => {
  const hostName = allSites[siteId]?.siteProperties.feedDomainURL
  if (hostName !== undefined && urlToFrom.includes(hostName)) {
    const originPath = new URL(urlToFrom)
    urlToFrom = originPath.pathname
  }
  if (hostName !== undefined && urlToGo.includes(hostName)) {
    const destinyPath = new URL(urlToGo)
    urlToGo = destinyPath.pathname
  }
  let send = null
  if (urlToGo.match(/\//) !== null) {
    send = JSON.stringify({
      redirect_to: urlToGo
    })
  } else {
    send = JSON.stringify({
      document_id: urlToGo
    })
  }

  const config = {
    method: 'post',
    url: `https://api.metroworldnews.arcpublishing.com/draft/v1/redirect/${siteId}/${urlToFrom}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: access.token
    },
    data: send
  }

  return await axios(config)
    .then(function (response) {
      const result = response.data
      if (result.create_at !== undefined) {
        return true
      } else if (result.error_code !== undefined) {
        return result.error_code
      } else {
        return false
      }
    })
    .catch(function (error) {
      console.log('Error de redirección ====>', error)
      return false
    })
}

export const checkRedirect = async (siteId: string, urlToSearch: string): Promise<string|null> => {
  const config = axiosConfig(siteId, urlToSearch)
  return await axios(config)
    .then(function (response) {
      const result = response.data
      if (result?.redirect_to !== undefined) {
        return result.redirect_to
      } else if (result?.document_id !== undefined) {
        return result.document_id
      } else {
        return null
      }
    })
    .catch(function (_error) {
      // console.log(error)
      return null
    })
}

export const deleteRedirect = async (siteId: string, urlToDelete: string): Promise<boolean> => {
  const config = axiosConfig(siteId, urlToDelete, '', 'delete')
  return await axios(config)
    .then(function (response) {
      const result = response.data
      if (result?.redirect_to !== undefined) {
        return true
      } else {
        return false
      }
    })
    .catch(function (error) {
      console.log(error)
      return false
    })
}
