import { getArcExposeStorySearch } from "../../subscribers/arcSearch";
import { arcExposeStory } from "../../types/urlToVerify";

export const searchStoriesByAuthor = async (siteId:string, authorSlug:string): Promise<arcExposeStory[]> => {
  const returnValues = '_id,type,publish_date,credits,taxonomy,websites'
  const queryString = `/content/v4/search/published?website=${siteId}&q=credits.by.slug:"${authorSlug}"&_sourceInclude=${returnValues}`
  return await getArcExposeStorySearch(queryString,siteId)
}