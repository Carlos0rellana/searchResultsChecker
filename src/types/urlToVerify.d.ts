type typeOfLink = 'rare' | 'story' | 'author' | 'tag' | 'section' | 'video' | 'gallery' | 'file' | 'sitemap' | 'search' | 'any'
type statusCheck = 'none' | 'ok' | 'manual' | 'failed' | 'process' | 'waiting-ok' | 'google' | 'date' | 'arcTime' | 'recent' | 'metro' | 'olderRedirect'
type method = 'redirect' | 'overwrite' | 'resolver' | 'create' | 'clear' | null

export interface filterOptions {
  httpStatus: number
  type: typeOfLink
  status: statusCheck
}

export interface linkValues {
  url: string | null
  httpStatus: number | null
  typeOfUrl: typeOfLink | null
  outputType: string | null
  probableSolution: string|null
  solution: method[]|null
  status: statusCheck = 'none'
}

export interface redirectPublimetro {
  idArc: string
  urlWpFrom: string
  urlWpTo: string
  urlComposer: string
}

export interface identityUrl {
  siteId: string
  storyId: string | null
}

export interface modLinkValues extends linkValues {
  position: number
}
