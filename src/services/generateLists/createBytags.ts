import { getArcExposeStorySearch } from "../../subscribers/arcSearch";
import { arcExposeStory } from "../../types/urlToVerify";

export const searchStoriesByTag = async (siteId:string, tagSlug:string): Promise<arcExposeStory[]> => {
  const returnValues = '_id,type,publish_date,credits,taxonomy,websites'
  const queryString = `/content/v4/search/published?website=${siteId}&q=taxonomy.tags.slug:"${tagSlug}"&_sourceInclude=${returnValues}`
  return await getArcExposeStorySearch(queryString,siteId)
}