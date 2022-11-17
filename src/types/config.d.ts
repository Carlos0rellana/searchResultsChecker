type typeOfSearch = 'url'|'title'

export interface ratioElementsOptions {
  type: typeOfSearch
  siteId: string
  valueToSearch: string
}

export interface searchInArcItemOptions {
  siteId: string
  search: string
  type: typeOfSearch
  priority: typeOfLink|false = false
}
