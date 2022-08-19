import axios from 'axios'
import sitesData from '../config/static_data/blocks.json'
import { SitesList } from '../types/sites'
import { typeOfLink } from '../types/urlToVerify'
const allSites: SitesList = sitesData as SitesList

export const searchInGoogleServiceApi = async (websiteId: string, toSearch: string, priority: typeOfLink|null = null): Promise< string | null> => {
  const idSearch = allSites[websiteId].siteProperties?.searchId !== undefined ? allSites[websiteId].siteProperties.searchId : null
  if (allSites[websiteId] !== undefined && idSearch !== null && idSearch !== undefined) {
    const config = {
      method: 'get',
      timeout: 1500,
      url: `https://www.googleapis.com/customsearch/v1?key=AIzaSyDU_qbCbOQfA2CYtCD_mD8DNXS60Op5A8Q&cx=${idSearch}&q=${toSearch}`
    }
    return await axios(config)
      .then(function (response) {
        const dataResults = response.data.searchInformation.totalResults
        const dataSearch = response.data.items
        if (dataResults > 0 && dataSearch !== undefined) {
          for (const searchItem of dataSearch) {
            if (priority === null) {
              if (searchItem.link?.match(toSearch) !== null) {
                const value = new URL(searchItem.link)
                return value.pathname
              }
            } else {
              const comparedStringType: string = priority === 'gallery' ? '/galeria' : '/video'
              if (searchItem.link?.match(toSearch) !== null && searchItem.link?.match(comparedStringType) === null
              ) {
                const value = new URL(searchItem.link)
                return value.pathname
              }
            }
          }
          return null
        }
        return null
      })
      .catch(function (error) {
        if (error.response?.statusText !== undefined) {
          console.error('Error de Search Google ====>', error.response.statusText)
          return error.response.statusText
        }
        return null
      })
  } else {
    return null
  }
}
