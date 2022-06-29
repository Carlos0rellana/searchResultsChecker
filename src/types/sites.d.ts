interface Location {
  language?: string
  timeZone?: string
  dateTimeFormat?: string
  dateFormat?: string
}

interface Properties{
  feedDomainURL?: string
  resizerURL?: string
  feedTitle?: string
  feedMarket?: string
  gtmID?: string
  feedLanguage?: string
  dateLocalization?: Location
}

export interface Site{
  siteProperties: Properties
}

export interface SitesList {
  [id: string]: Site
}
