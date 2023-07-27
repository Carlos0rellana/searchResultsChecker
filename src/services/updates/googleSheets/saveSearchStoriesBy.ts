import { updateRowLinkValues } from "../../../subscribers/googleSheets"
import { arcExposeStory } from "../../../types/urlToVerify"
import { delay } from "../../../utils/genericUtils"

export const updateResultsStories =async (sheetId:string,nameSheet:string,resultList:arcExposeStory[]) => {
  if(sheetId!=='false'){
    let count = 1
    for(const itemUpdate of resultList){
      const dataToStringArray = [itemUpdate.url,itemUpdate.site,itemUpdate.id,itemUpdate.composerUrl]
      await delay(1000)
      await updateRowLinkValues(sheetId,nameSheet,count,dataToStringArray)
      count++
    }
  }
}