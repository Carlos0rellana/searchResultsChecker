import { minimalTag } from './tags'

export interface modValues {
  tag: minimalTag|null
  subtype: string|null
  action: 'add' | 'remove' | 'mod'
}

export interface findArcArticle {
  site: string
  path: string
  data: any
}

export interface articleModifly extends findArcArticle{
  id: string
  tag: minimalTag|null
  status: 'ok' | 'fail' | 'waiting' | 'tag no exist' | 'draft'
}
