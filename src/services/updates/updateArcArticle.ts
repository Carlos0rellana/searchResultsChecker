import { publishDraftArticle, updateDraftArticle } from '../../subscribers/arcDraft'
import { getTagBySlug } from '../../subscribers/arcTags'
import { accessToGoogleSheets, checkSpreadSheet, createGoogleSheet, updateRowData } from '../../subscribers/googleSheets'
import { articleModifly, modValues } from '../../types/articleModfly'
import { delay } from '../../utils/genericUtils'
import { searchArticleByRoute } from '../search/searchArcArticles'

const checkItem = async (item: [string, string]): Promise <articleModifly|null> => {
  if (item[0]?.length > 3 && item[1]?.length > 3) {
    const tempConfig = JSON.parse(item[1])
    const returnConfig: modValues = {
      tag: null,
      subtype: null,
      action: 'mod'
    }
    if (tempConfig.tag !== undefined) {
      returnConfig.tag = await getTagBySlug(tempConfig.tag)
    }
    if (tempConfig?.subtype !== undefined && typeof tempConfig.subtype === 'string') {
      returnConfig.subtype = tempConfig.subtype
    }
    return await readyToUpdateSingleArticle(item[0], returnConfig)
  }
  return null
}

const clearData = (data: any): any => {
  const byList = []
  const contentElementList = []
  delete data.websites
  delete data.canonical_url
  delete data.taxonomy.sections
  delete data.taxonomy.sites
  delete data.taxonomy.primary_section
  delete data.taxonomy.primary_site
  delete data.publishing
  if (data.credits?.by !== undefined && data.credits.by.length > 0) {
    for (const author of data.credits.by) {
      delete author.version
      byList.push(author)
    }
  }
  if (data.content_elements !== undefined && data.content_elements.length > 0) {
    for (const content of data.content_elements) {
      if (content.additional_properties !== undefined) {
        delete content.creditIPTC
        delete content.country_name
      }
      contentElementList.push(content)
    }
  }
  if (data.promo_items.basic !== undefined) {
    delete data.promo_items.basic.creditIPTC
    delete data.promo_items.basic.country_name
  }
  data.credits.by = byList
  data.content_elements = contentElementList
  return data
}

export const readyToUpdateSingleArticle = async (siteUrl: string, values: modValues): Promise<articleModifly|null> => {
  const findData = await searchArticleByRoute(siteUrl)
  if (findData?.data._id !== undefined) {
    const tempData: articleModifly = {
      site: findData.site,
      path: findData.path,
      data: clearData(findData.data),
      id: findData.data._id,
      tag: null,
      status: 'waiting'
    }

    if (values.subtype !== null) {
      tempData.data.subtype = values.subtype
    }
    if (values?.tag?.slug !== null) {
      if (findData.data?.taxonomy?.tags !== undefined) {
        if (findData.data.taxonomy.tags.find(function (taxonomyTag: { slug: string }) { return taxonomyTag.slug === values.tag?.slug }) === false) {
          tempData.data.taxonomy.tags.push(values.tag)
        }
      } else {
        tempData.data.taxonomy.tags = [values.tag]
      }
    }
    return tempData
  }
  return null
}

export const readyToUpdateListArticle = async (sheetId: string): Promise<Array<[articleModifly, number]>|null> => {
  try {
    const urlList: Array<[articleModifly, number]> = []
    const rows = await accessToGoogleSheets(sheetId, 'UrlList')
    if (rows !== null) {
      for (let count = 0; count < rows.length; count++) {
        let item = await checkItem([rows[count][0], rows[count][1]])
        if (item === null) {
          item = {
            site: 'no data',
            path: rows[count][0],
            data: 'no data',
            id: 'no data',
            tag: null,
            status: 'fail'

          }
        }
        urlList.push([item, count])
      }
      return urlList
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const searchAndUpdateArticlesBucle = async (sheetId: string): Promise <Array<[articleModifly, number]> | null> => {
  try {
    const tempList = await readyToUpdateListArticle(sheetId)
    const outputName = 'output'
    const checkOutput = await checkSpreadSheet(sheetId, outputName)
    if (tempList !== null) {
      const start = new Date().getTime()
      const resultResponse = []
      if (!checkOutput) {
        await createGoogleSheet([['id', 'site', 'path', 'tag', 'status']], outputName, sheetId)
      }
      for (let e = 0; e < tempList.length; e++) {
        const element = tempList[e]
        const toSave = element[0]
        if (toSave.site !== 'no data' && toSave.id !== 'no data') {
          const item = await updateDraftArticle(toSave)
          if (item.id !== undefined && item.document_id !== undefined) {
            const publish = await publishDraftArticle(toSave.id)
            toSave.status = publish.id !== undefined && publish.document_id !== undefined ? 'ok' : 'draft'
          } else {
            toSave.status = 'fail'
          }
        }
        await updateRowData(sheetId, outputName, e + 2, [toSave.id, toSave.site, toSave.path, toSave.tag?.slug ?? 'null', toSave.status])
        resultResponse.push(element)
        await delay(1000)
      }
      const end = (new Date().getTime() - start) / 60000
      console.log('\nTiempo de ejecución ===>', end, ' min.\n')
      return resultResponse
    }
  } catch {
    return null
  }
  return null
}
