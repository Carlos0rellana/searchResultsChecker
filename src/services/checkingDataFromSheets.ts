import { accessToGoogleSheets, updateAgroupOfValuesInSheet, updateRowData } from '../subscribers/googleSheets'
import { arcSimpleStory, filterOptions, linkValues, modLinkValues } from '../types/urlToVerify'
import { checkMetroDB } from '../subscribers/getArticleRedirectFromPublimetroDB'
import { searchInGoogleServiceApi } from '../subscribers/googleApiSearch'
import { delay, fetchData, geIdentiflyUrl, getSimpleLinkValues, sanitizePathToWWWWpath } from '../utils/generic_utils'

import cliProgress from 'cli-progress'
import colors from 'ansi-colors'

import { identitySearch, SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'
import { checkRedirect } from '../subscribers/arcRedirects'
import { searchInSitemapByDate } from '../subscribers/searchInSitemaps'
import { msgProgressBar } from '../types/progressBarMsgs'
import { getTagBySlug } from '../subscribers/arcTags'
import { searchInBucleArc } from '../subscribers/arcSearch'

const allSites: SitesList = sitesData as SitesList

const filterByDate = async (rows: string[][]): Promise<modLinkValues[]> => {
  let key: number = 0
  const rowsOfRedirect: modLinkValues[] = []
  const progressRevisionOfSearch = new cliProgress.SingleBar({
    format: `Search URL in sitemaps | ${colors.bgYellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  const datePattern = /[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g

  progressRevisionOfSearch.start(rows.length, 0)
  for (const urlValidate of rows) {
    const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
    if (rowData.url !== null &&
        rowData.status !== 'ok' &&
        rowData.status === 'none' &&
        rowData.httpStatus !== null &&
        rowData.httpStatus >= 400 &&
        rowData.httpStatus < 500) {
      const dateArticle = rowData.url?.match(datePattern)
      if (dateArticle !== null) {
        const date = datePattern.exec(rowData.url)
        const basicInfo = geIdentiflyUrl(rowData.url)
        const hostName = allSites[basicInfo.siteId]?.siteProperties.feedDomainURL
        if (hostName !== undefined && date !== null && basicInfo.storyTitle.length > 0) {
          let dateFilter = date[0]
          if (rowData.url.split(datePattern).length > 2) {
            let myArray
            while ((myArray = datePattern.exec(rowData.url)) !== null) {
              dateFilter = myArray[0]
            }
          }
          const feedUrl = `${hostName}/arc/outboundfeeds/sitemap/${dateFilter.replace(/\//g, '-')}?outputType=xml`
          const result = await searchInSitemapByDate(feedUrl, basicInfo.storyTitle)
          if (await result !== null) {
            rowData.solution = ['redirect']
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            rowData.probableSolution = hostName + result
            const year = Number(dateArticle[0].split('/')[0])
            if (year >= 2022) {
              rowData.status = 'arcTime'
            } else if (year >= 2016) {
              rowData.status = 'recent'
            } else {
              rowData.status = 'date'
            }
            rowsOfRedirect.push(rowData)
          }
        }
      }
    }
    key++
    progressRevisionOfSearch.update(key)
  }
  progressRevisionOfSearch.stop()
  return rowsOfRedirect
}

const genericFilter = (itemList: string[][]|null, options: filterOptions): modLinkValues[] => {
  const result: modLinkValues[] = []
  if (itemList !== null && itemList.length > 0) {
    let key = 0
    const progressRevisionOfSearch = new cliProgress.SingleBar({
      format: `Filter by ${options.type} | ${colors.bgCyan('{bar}')} | {percentage}% || {value}/{total} ${options.type} URL checkeds`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    console.log(`\nStart to filter by ${options.type}:`)
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const info of itemList) {
      const linkData: modLinkValues = getSimpleLinkValues(info, key)
      const checkingType = options.type === 'any' ? (linkData.typeOfUrl === 'gallery' || linkData.typeOfUrl === 'story' || linkData.typeOfUrl === 'video' || linkData.typeOfUrl === 'search') : linkData.typeOfUrl === options.type
      if (linkData.httpStatus !== null &&
          (options.method === null || linkData.solution?.includes(options.method) === true) &&
          linkData.httpStatus < options.httpStatus + 99 &&
          linkData.httpStatus >= options.httpStatus &&
          linkData.status === options.status &&
          checkingType) {
        result.push(linkData)
      }
      key++
      progressRevisionOfSearch.update(key)
    }
    progressRevisionOfSearch.stop()
  }
  return result
}

const searchInMetroDatabase = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Metro DB:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = new cliProgress.SingleBar({
      format: `Search in Metro DB | ${colors.yellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(linkData.url)
        const returnRedirect: string | null = await checkMetroDB(basicInfo.siteId, basicInfo.storyTitle)
        if (await returnRedirect !== null && allSites[basicInfo.siteId]?.siteProperties?.feedDomainURL !== undefined) {
          const urlBase: string = returnRedirect?.match('/') !== null ? allSites[basicInfo.siteId].siteProperties.feedDomainURL as string : ''
          linkData.probableSolution = urlBase + (returnRedirect !== null ? returnRedirect : '')
          linkData.solution = ['redirect']
          linkData.status = 'metro'
          findUrl.push(linkData)
          progressRevisionOfSearch.update(key)
          await delay(2000)
        }
      }
      key++
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

const searchInArcCirculate = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Arc Sites:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = new cliProgress.SingleBar({
      format: `Search in Arc Sites | ${colors.yellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(linkData.url)
        const findURLinArc = await searchInBucleArc(basicInfo.siteId, basicInfo.storyTitle) as arcSimpleStory
        if (await findURLinArc.id !== undefined && allSites[findURLinArc.site]?.siteProperties?.feedDomainURL !== undefined) {
          const checkOrigin = basicInfo.siteId === findURLinArc.site
          const rootUrl = ((allSites[findURLinArc.site].siteProperties.feedDomainURL as string).length > 0) ? allSites[findURLinArc.site].siteProperties.feedDomainURL as string : ''
          linkData.probableSolution = checkOrigin ? findURLinArc.url : rootUrl + findURLinArc.url
          linkData.solution = checkOrigin ? ['redirect'] : ['re-circulate']
          if (findURLinArc.isTitleByIteration) {
            linkData.status = 'searchByTitle'
          } else {
            linkData.status = findURLinArc.id.match('_redirect_') === null ? 'circulate' : 'findUrlWithRedirectTo'
          }
          findUrl.push(linkData)
          progressRevisionOfSearch.update(key)
          await delay(2000)
        }
      }
      key++
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

const searchInGoogle = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Google:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = new cliProgress.SingleBar({
      format: `Search in Google | ${colors.yellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(linkData.url)
        const googleSearch = await searchInGoogleServiceApi(basicInfo.siteId, basicInfo.storyTitle)
        if (await googleSearch !== null && googleSearch === 'Too Many Requests') {
          progressRevisionOfSearch.update(key)
          progressRevisionOfSearch.stop()
          console.log('Se llega al limite de busquedas en GOOGLE.')
          return findUrl
        }
        if (await googleSearch !== null && googleSearch !== 'Too Many Requests') {
          const urlBase: string = allSites[basicInfo.siteId].siteProperties.feedDomainURL as string
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          linkData.probableSolution = urlBase + googleSearch
          linkData.solution = ['redirect']
          linkData.status = 'google'
          findUrl.push(linkData)
        }
        progressRevisionOfSearch.update(key)
        await delay(2000)
      }
      key++
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

const searchInRedirects = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Arc:')
  const findUrl: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = new cliProgress.SingleBar({
      format: `Search in Arc | ${colors.yellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const linkData of itemList) {
      if (linkData.url !== null) {
        const basicInfo = geIdentiflyUrl(sanitizePathToWWWWpath(linkData.url))
        const urlBase: string = allSites[basicInfo.siteId].siteProperties.feedDomainURL as string
        const pathUrl = new URL(linkData.url)
        let urlContest = pathUrl.pathname
        if (linkData.status === 'findUrlWithRedirectTo' && linkData.probableSolution !== null) {
          urlContest = linkData.probableSolution
        }
        let arcRedirectSearch = await checkRedirect(basicInfo.siteId, urlContest)
        if (await arcRedirectSearch !== null) {
          linkData.probableSolution = arcRedirectSearch?.match('/') !== null ? urlBase + (arcRedirectSearch !== null ? arcRedirectSearch : '') : arcRedirectSearch
          linkData.solution = ['redirect']
          linkData.status = 'olderRedirect'
          findUrl.push(linkData)
        } else {
          if (pathUrl.pathname.match(/\/$/) !== null) {
            arcRedirectSearch = await checkRedirect(basicInfo.siteId, urlContest.replace(/.$/, ''))
          } else {
            arcRedirectSearch = await checkRedirect(basicInfo.siteId, `${urlContest}/`)
          }
          if (await arcRedirectSearch !== null) {
            const root: string = arcRedirectSearch?.match('/') !== null ? urlBase : ''
            linkData.probableSolution = root + (arcRedirectSearch !== null ? arcRedirectSearch : '')
            linkData.solution = ['redirect']
            linkData.status = 'olderRedirect'
            findUrl.push(linkData)
          }
        }
        await delay(2000)
      }
      key++
      progressRevisionOfSearch.update(key)
    }
    progressRevisionOfSearch.stop()
  }
  return findUrl
}

const searchTagsInArc = async (itemList: modLinkValues[]): Promise<modLinkValues[]> => {
  console.log('\nStart to search in Arc:')
  const findTags: modLinkValues[] = []
  if (itemList.length > 0) {
    let key: number = 0
    const progressRevisionOfSearch = new cliProgress.SingleBar({
      format: `Search Tags in Arc | ${colors.yellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    progressRevisionOfSearch.start(itemList.length, 0)
    for (const tagItem of itemList) {
      if (tagItem.url !== null) {
        let tagSlug: string = tagItem.url.split(/\/tags?\//)[1]
        tagSlug = tagSlug.match(/\//) !== null ? tagSlug.split('/')[0] : tagSlug
        if (await getTagBySlug(tagSlug)) {
          tagItem.solution = ['redirect']
          tagItem.probableSolution = `/tag/${tagSlug}`
        } else {
          tagItem.solution = ['create']
          tagItem.probableSolution = tagSlug
        }
        tagItem.status = 'process'
        findTags.push(tagItem)
      }
      key++
      progressRevisionOfSearch.update(key)
    }
    progressRevisionOfSearch.stop()
  }
  return findTags
}

export const checkAuthorInOutput = async (sheetId: string, filter: boolean = false): Promise<any> => {
  try {
    const currentList: modLinkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    rows?.forEach((row, key) => {
      const rowData: modLinkValues = getSimpleLinkValues(row, key)
      if (rowData.typeOfUrl === 'author') {
        if (!filter) {
          currentList.push(rowData)
        }
        if (filter && parseInt(row[1]) > 499) {
          currentList.push(rowData)
        }
      }
    })
  } catch (error) {
    console.error(error)
    return null
  }
}

export const check404inGoogle = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const currentListModValues: modLinkValues[] = []
    const progressRevision = new cliProgress.SingleBar({
      format: `LocalRedirects Ckeck's | ${colors.magenta('{bar}')} | {percentage}% || {value}/{total} Local's Checks`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== null) {
      let key: number = 0
      progressRevision.start(rows.length, 0)
      for (const row of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(row, key)
        if (rowData.typeOfUrl === 'story' && rowData.httpStatus === 404 && rowData.status === 'none') {
          let urlClear: identitySearch|null = null
          if (rowData.probableSolution !== null && rowData.probableSolution !== 'null' && rowData.probableSolution.length > 0 && rowData.status === 'none') {
            urlClear = geIdentiflyUrl(rowData.probableSolution)
          } else if (rowData.url !== null && rowData.url !== 'null' && rowData.url.length > 0) {
            urlClear = geIdentiflyUrl(rowData.url)
          }
          if (urlClear !== null && urlClear.storyTitle !== 'null' && rowData.status === 'none' && urlClear.storyTitle.length > 0) {
            const currentUrl: string | null = await checkMetroDB(urlClear.siteId, urlClear.storyTitle)
            if (currentUrl !== null) {
              rowData.probableSolution = currentUrl
              rowData.status = 'metro'
              rowData.solution = ['redirect']
              currentListModValues.push(rowData)
              const linkData = rowData as linkValues
              await updateRowData(sheetId, 'Output', rowData.position, linkData)
            } else {
              const urlSite = allSites[urlClear.siteId].siteProperties.feedDomainURL
              if (urlSite !== null && urlSite !== undefined) {
                const googleSearch = await searchInGoogleServiceApi(urlClear.siteId, urlClear.storyTitle)
                if (googleSearch !== null) {
                  rowData.probableSolution = googleSearch
                  rowData.solution = ['redirect']
                  rowData.status = 'google'
                  currentListModValues.push(rowData)
                  const linkData = rowData as linkValues
                  await updateRowData(sheetId, 'Output', rowData.position, linkData)
                }
              }
            }
            await delay(2000)
          }
        }
        key++
        progressRevision.update(key)
      }
    }
    progressRevision.stop()
    return currentListModValues
  } catch (error) {
    console.error(error)
  }
  return null
}

export const checkRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const rowsOfRedirect: modLinkValues[] = []
    let redirect: string|null = null
    const progressRevision = new cliProgress.SingleBar({
      format: `Search redirects | ${colors.white('{bar}')} | {percentage}% || {value}/{total} Redirects find`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== undefined && rows !== null) {
      let progressCount: number = 1
      let key: number = 0
      for (const urlValidate of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
        if ((rowData.status === 'process' || rowData.status === 'waiting-ok') &&
             rowData.httpStatus !== null &&
             rowData.httpStatus >= 400 &&
             rowData.httpStatus < 500) {
          rowsOfRedirect.push(rowData)
        }
        key++
      }
      progressRevision.start(rowsOfRedirect.length, 0)
      for (const item of rowsOfRedirect) {
        if (item.url !== null) {
          const URI = new URL(item.url)
          const earlyUrl = geIdentiflyUrl(item.url)
          const externalLink: linkValues = item as linkValues
          const originPath: string = URI.pathname
          redirect = await checkRedirect(earlyUrl.siteId, originPath)
          const httpResponseCheck = await fetchData(item.url)
          if (typeof httpResponseCheck.httpStatus === 'number' && httpResponseCheck.httpStatus < 400 && item.url !== 'undefined') {
            externalLink.status = 'ok'
            await updateRowData(sheetId, 'Output', item.position, externalLink)
          } else if (redirect !== null) {
            externalLink.status = 'manual'
            externalLink.probableSolution = redirect
            externalLink.solution = ['redirect', 'resolver']
            await updateRowData(sheetId, 'Output', item.position, externalLink)
          }
        }
        progressRevision.update(progressCount)
        progressCount++
      }
      progressRevision.stop()
    }
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInDBFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'any',
        status: 'none'
      }
      const rowsOfRedirect = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchInMetroDatabase(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsOfRedirect
      } else {
        console.log('No se encontrarons links en base de datos de metro')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInGoogleFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'any',
        status: 'none'
      }
      const rowsOfRedirect = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchInGoogle(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se encontrarons links en Google.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInArcRedirectsFromSheetsWhenIsFoundInOtherUrl = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: 'redirect',
        type: 'any',
        status: 'findUrlWithRedirectTo'
      }
      const rowsOfRedirect = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchInRedirects(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se encontrarons redireccionamientos en Arc.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInArcRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'any',
        status: 'none'
      }
      const rowsOfRedirect = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchInRedirects(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se encontrarons redireccionamientos en Arc.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInArcCirculateFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'any',
        status: 'none'
      }
      const rowsOfRedirect = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchInArcCirculate(rowsOfRedirect)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Url encontradas en sitios de Arc.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se encontrarons URL`s en Arc.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkTagInArcFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'tag',
        status: 'none'
      }
      const rowsOfTags = genericFilter(rows, options)
      const rowsToSaveInSheet = await searchTagsInArc(rowsOfTags)
      if (await rowsToSaveInSheet.length > 0) {
        const barText: msgProgressBar = {
          description: 'Update status URL in GoogleSheets',
          nameItems: 'Celdas modificadas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsToSaveInSheet, barText)
        return rowsToSaveInSheet
      } else {
        console.log('No se modificaron celdas.')
      }
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkByDatesFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')

    if (rows !== undefined && rows !== null) {
      const rowsOfRedirect = await filterByDate(rows)
      if (await rowsOfRedirect.length > 0) {
        const barText: msgProgressBar = {
          description: 'Guardando urls encontradas por fechas',
          nameItems: 'Url guardadas.'
        }
        await updateAgroupOfValuesInSheet(sheetId, rowsOfRedirect, barText)
        return rowsOfRedirect
      } else {
        console.log('No se encontrarons links con fechas')
      }
    }
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkTagsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
        method: null,
        type: 'tag',
        status: 'waiting-ok'
      }

      const clearTagsList = genericFilter(rows, options)
      if (clearTagsList.length > 0) {
        for (const tagLink of clearTagsList) {
          if (tagLink.url !== null) {
            const checkValues = await fetchData(tagLink.url)
            const currentTagValues = tagLink as linkValues
            if (checkValues.httpStatus !== null &&
                checkValues.httpStatus >= 400 &&
                checkValues.httpStatus < 500) {
              currentTagValues.status = 'manual'
            } else {
              currentTagValues.status = 'ok'
            }
            await updateRowData(sheetId, 'Output', tagLink.position, currentTagValues)
            urlList.push(currentTagValues)
          }
        }
      }
      return urlList
    }
    return null
  } catch (error) {
    console.error(error)
    return null
  }
}
