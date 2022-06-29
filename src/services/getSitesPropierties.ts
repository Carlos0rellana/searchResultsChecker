import { SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'

const allSites: SitesList = sitesData as SitesList

export const getSiteList = (): SitesList => allSites
