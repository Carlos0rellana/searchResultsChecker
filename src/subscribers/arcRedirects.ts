import { SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'
import { getDataFromArc } from '../models/getDataFromArc'
import { createInArc } from '../models/addDataFromArc'
import { deleteDataFromArc } from '../models/deleteDataFromArc'

const allSites: SitesList = sitesData as SitesList

export const makeRedirect = async (siteId: string, urlToFrom: string, urlToGo: string): Promise<false|string> => {
  const hostName = allSites[siteId]?.siteProperties.feedDomainURL
  if (hostName !== undefined){
    if(urlToFrom.includes(hostName)) {
      urlToFrom = new URL(urlToFrom).pathname
    }
    if(urlToGo.includes(hostName)) {
      urlToGo = new URL(urlToGo).pathname
    }

    // setea si entra un id en vez de una url para redireccionar
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

    return await createInArc(`/draft/v1/redirect/${siteId}/${urlToFrom}`, send)
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
  return false
}

export const checkRedirect = async (siteId: string, urlToSearch: string): Promise<string|null> => {
  return await getDataFromArc(`/draft/v1/redirect/${siteId}/${urlToSearch}`)
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
  return await deleteDataFromArc(`/draft/v1/redirect/${siteId}/${urlToDelete}`)
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