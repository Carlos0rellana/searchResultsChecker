import { linkValues, modLinkValues } from "../../types/urlToVerify"
import { fetchData } from "../../utils/genericUtils"
import { searchCirculate } from "./searchArcCirculate"
import { searchRedirect } from "./searchArcRedirects"
import { searchSection } from "./searchArcSection"
import { searchSitemaps } from "./searchArcSitemaps"
import { searchTag } from "./searchArcTags"
import { searchMetro } from "./searchMetroDb"


export const searchPosibilities = async (linkData:modLinkValues): Promise < modLinkValues | null > => {
    if(linkData.url !== null && linkData.status === 'none' ){
        switch (linkData.typeOfUrl) {
            case 'search':
                linkData.probableSolution = '/buscador/'
                return linkData
            case 'tag' :
                return await searchTag(linkData,true) 
            case 'rare':
            case 'section':
            case 'tag':
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