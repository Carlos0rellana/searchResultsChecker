type typeOfLink = 'rare' | 'story' | 'author' | 'tag' | 'section' | 'video' | 'gallery' | 'file' | 'origin' | 'touch'
type statusCheck = 'none' | 'ok' | 'manual'

export interface linkValues {
  url: string | null
  httpStatus: number | null
  typeOfUrl: typeOfLink | null
  outputType: string | null
  problemLists: string|null
  possibleSolution: string | null
  status: statusCheck = 'none'
}

export interface modLinkValues extends linkValues {
  position: number
}
