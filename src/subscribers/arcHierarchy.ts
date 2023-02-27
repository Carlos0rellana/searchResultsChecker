import axios from 'axios'
import * as access from '../config/tokenAccessArc.json'

export const getCategoryById = async (siteId:string,categoryId: string): Promise<boolean> => {
    const config = {
      method: 'get',
      url: `https://api.metroworldnews.arcpublishing.com/site/v3/website/${siteId}/section/?_id=${categoryId}`,
      headers: {
        Authorization: access.token
      }
    }
    return await axios(config)
      .then(function (response) {
        const result = response.data
        if (result?._id !== undefined && result?._id !== null ) {
          return true
        }
        return false
      })
      .catch(function (_error) {
        //console.log(error)
        return false
      })
}