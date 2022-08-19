import axios from 'axios'
import xml2js from 'xml2js'

export const searchInSitemapByDate = async (urlPath: string, searchTitle: string): Promise< string | null > => {
  const config = {
    method: 'get',
    url: urlPath
  }

  return await axios(config)
    .then(async (response) => {
      const xml = response.data
      const parser = new xml2js.Parser()
      const parserValueResult = parser.parseStringPromise(xml).then((result) => {
        const urlList = result.urlset.url
        if (urlList !== undefined && urlList.length > 0) {
          let value: string | null = null
          for (const newsItem of urlList) {
            const newsPath: string|null = newsItem.loc[0] as string
            if (newsPath.match(searchTitle) !== null) {
              const URI = new URL(newsPath)
              value = URI.pathname
            }
          }
          return value
        } else {
          return null
        }
      })
        .catch((err) => {
          console.log('Error===>', err)
          return null
        })
      return await parserValueResult
    })
    .catch(function (error) {
      console.log(error)
      return null
    })
}
