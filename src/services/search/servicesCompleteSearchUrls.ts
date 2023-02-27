import { accessToGoogleSheets, updateRowData } from "../../subscribers/googleSheets"
import { linkValues, modLinkValues } from "../../types/urlToVerify"
import { checkBarConfig } from "../../utils/barUtils"
import { getSimpleLinkValues, delay, fetchData } from "../../utils/genericUtils"
import { searchCirculate } from "./servicesArcCirculate"
import { searchRedirect } from "./servicesArcRedirects"
import { searchSection } from "./servicesArcSection"
import { searchSitemaps } from "./servicesArcSitemaps"
import { searchTag } from "./servicesArcTags"
import { searchMetro } from "./servicesMetroSearch"


const searchPosibilities = async (linkData:modLinkValues): Promise < modLinkValues | null > => {
    if(linkData.url !== null && linkData.status === 'none' ){
        switch (linkData.typeOfUrl) {
            case 'search':
                linkData.probableSolution = '/buscador/'
                return linkData
            case 'tag' :
                return await searchTag(linkData,true) 
            case 'rare':
                let tempRare = await searchSection(linkData) ?? await searchTag(linkData,false) ?? await searchMetro(linkData)
                return tempRare
            case 'redirect':
            case 'story':
            case 'video':
            case 'gallery':
            case 'any':
                let tempAny = await searchRedirect(linkData) ?? await searchSitemaps(linkData) ?? await searchMetro(linkData) ?? await searchCirculate(linkData)
                return tempAny
            default:
                return null
        }
    }
    return null
}

export const searchPosibilitiesBucle = async ( itemList : modLinkValues[]): Promise<modLinkValues[]> => {
    console.log('\nStart to search:')
    const tempArrayLinks : modLinkValues[] = []
    if(itemList.length>0){
        for(const item of itemList){
            let tempData = await searchPosibilities(item)
            if(tempData !== null){
                tempArrayLinks.push(tempData)
            }
        }
    }
    return tempArrayLinks
}

export const searchByUrl = async (url:string): Promise < linkValues > => {
    let tempData: modLinkValues = await fetchData(url) as modLinkValues
    tempData.position = 0
    let result = await searchPosibilities(tempData) as linkValues
    return result ?? tempData
}

export const searchAndUpdatePosibilitiesInSheets = async (sheetId: string): Promise< modLinkValues[] | null > => {
    try {
        let rows = await accessToGoogleSheets(sheetId, 'Output')
        if (rows !== undefined && rows !== null) {
            let key = 0
            const results: modLinkValues[] = []
            const start = new Date().getTime()
            const progressRevision = checkBarConfig('Search URL','check URL\'s') 
            progressRevision.start(rows.length, 0)
            for (const info of rows) {
                const linkData: modLinkValues = getSimpleLinkValues(info, key)
                let tempValues = await searchPosibilities(linkData)
                if(tempValues!==null){
                    updateRowData(sheetId,'Output',tempValues.position,tempValues)
                    results.push(tempValues)
                    await delay(1000)
                }
                key++
                progressRevision.update(key)
            }
            progressRevision.stop()
            const end = (new Date().getTime() - start)/60000
            console.log('\nTiempo de ejecución ===>',end,' min.\n')
            return results
          } else {
            console.log('No se modificaron celdas.')
            return null
          }
      } catch (_error) {
        //console.error(error)
        return null
      }
}