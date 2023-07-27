import { identitySearch } from "../../types/sites"
import { modLinkValues } from "../../types/urlToVerify"
import { searchBarConfig } from "../../utils/barUtils"
import { noSolution } from "../../utils/genericUtils"

export const getGoogleSearchUrl = (item: identitySearch): string => {
  return `https://www.google.com/search?q=${item.storyTitle.replace(/-/g,'+')}`
}

export const generateGoogleSearchLinks = (itemList: modLinkValues[]): modLinkValues[] => {
  console.log('\nStart to Generating links to Google:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfGenerate = searchBarConfig('Generating links to Google')
    progressRevisionOfGenerate.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        let tempData:modLinkValues = linkData
        findUrl.push(noSolution(tempData))
        progressRevisionOfGenerate.update(key)
      }
      key++
    }
    progressRevisionOfGenerate.stop()
  }
  return findUrl
}