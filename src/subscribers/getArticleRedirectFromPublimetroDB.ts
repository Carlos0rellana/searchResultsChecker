import axios from 'axios'

export const checkMetroDB = async (websiteId: string, toSearch: string): Promise< string | null> => {
  const config = {
    method: 'get',
    timeout: 10000,
    url: `https://pdfserv2.readmetro.com/getUrlArc.php?website=${websiteId}&url=${toSearch}`

  }
  return await axios(config)
    .then(function (response) {
      const data = response.data
      let currentUrl: string | null = null
      if (data?.total > 0 && data?.data?.info_arc !== undefined) {
        const listRedirect: any = data?.data?.info_arc
        if (listRedirect.length > 1) {
          listRedirect.forEach((foundRedirect: any) => {
            if (foundRedirect.id_arc !== undefined &&
                foundRedirect.id_arc !== null &&
                foundRedirect?.url_arc !== undefined &&
                foundRedirect?.url_arc?.match(`${toSearch}-[0-9][0-9]?`) == null) {
              currentUrl = foundRedirect.url_arc
            }
          })
          if (currentUrl === null) {
            listRedirect.forEach((foundRedirect: any) => {
              for (let index = 0; index < 20; index++) {
                if (foundRedirect.id_arc !== undefined && foundRedirect.id_arc !== null &&
                    foundRedirect?.url_arc !== undefined &&
                    foundRedirect?.url_arc?.match(`${toSearch}-${index}`) != null) {
                  currentUrl = foundRedirect.url_arc
                }
              }
            })
          }
        } else {
          if (listRedirect[0]?.url_arc !== undefined) {
            currentUrl = listRedirect[0].url_arc
          }
        }
        return currentUrl
      } else {
        return null
      }
    })
    .catch(function (_error) {
      // console.error(error)
      return null
    })
}
