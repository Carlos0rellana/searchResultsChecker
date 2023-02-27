import { getCategoryById } from "../../subscribers/arcHierarchy"
import { modLinkValues } from "../../types/urlToVerify"
import { geIdentiflyUrl } from "../../utils/genericUtils"


export const searchSection =async (sectionItem:modLinkValues): Promise < modLinkValues| null > => {
    if(sectionItem.url!==null){
        let sectionId: string | null = null
        const siteId = geIdentiflyUrl(sectionItem.url).siteId
        if (sectionItem.url.match(/\/categor(y|ia)\//) !== null) {
            sectionId = `/${sectionItem.url.split(/\/categor(y|ia)\//)[1]}`
        } 
        if (sectionId !== null && await getCategoryById(sectionId,siteId)){
            sectionItem.solution = ['redirect']
            sectionItem.probableSolution = sectionId
            sectionItem.typeOfUrl='section'
            sectionItem.status = 'process'
            return sectionItem
        }
    }
    return null
}