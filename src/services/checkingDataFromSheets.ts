import { accessToGoogleSheets, updateAgroupOfValuesInSheet, updateRowData } from '../subscribers/googleSheets'
import { filterOptions, linkValues, modLinkValues } from '../types/urlToVerify'
import { checkredirect } from '../subscribers/getArticleRedirectFromPublimetroDB'
import { searchInGoogleServiceApi } from '../subscribers/googleApiSearch'
import { fetchData, geIdentiflyUrl, getSimpleLinkValues } from '../utils/generic_utils'

import cliProgress from 'cli-progress'
import colors from 'ansi-colors'

import { identitySearch, SitesList } from '../types/sites'
import sitesData from '../config/static_data/blocks.json'
import { checkRedirect } from '../subscribers/arcRedirects'
import { searchInSitemapByDate } from '../subscribers/searchInSitemaps'
import { msgProgressBar } from '../types/progressBarMsgs'

const allSites: SitesList = sitesData as SitesList

const delay = async (ms: number): Promise<any> => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

const filterByDate = async (rows: string[][]): Promise<modLinkValues[]> => {
  let key: number = 0
  const rowsOfRedirect: modLinkValues[] = []
  const progressRevisionOfSearch = new cliProgress.SingleBar({
    format: `Search URL in sitemaps | ${colors.bgYellow('{bar}')} | {percentage}% || {value}/{total} URLs`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
  const datePattern = /[0-9]{4}\/[0-9]{2}\/[0-9]{2}/
  progressRevisionOfSearch.start(rows.length, 0)
  for (const urlValidate of rows) {
    const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
    if (rowData.url !== null && rowData.status !== 'ok' && rowData.status === 'none' && rowData.httpStatus === 404) {
      if (rowData.url?.match(datePattern) !== null) {
        const date = datePattern.exec(rowData.url)
        const basicInfo = geIdentiflyUrl(rowData.url)
        const hostName = allSites[basicInfo.siteId]?.siteProperties.feedDomainURL
        if (hostName !== undefined && date !== null && basicInfo.storyTitle.length > 0) {
          const feedUrl = `${hostName}/arc/outboundfeeds/sitemap/${date[0].replace(/\//g, '-')}?outputType=xml`
          const result = await searchInSitemapByDate(feedUrl, basicInfo.storyTitle)
          if (await result !== null) {
            rowData.solution = ['redirect']
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            rowData.probableSolution = hostName + result
            rowData.status = 'date'
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
      const checkingType = options.type === 'any' ? (linkData.typeOfUrl === 'gallery' || linkData.typeOfUrl === 'story' || linkData.typeOfUrl === 'video') : linkData.typeOfUrl === options.type
      if (linkData.httpStatus !== null &&
          linkData.httpStatus < options.httpStatus + 100 &&
          linkData.httpStatus >= options.httpStatus &&
          linkData.status === options.status && checkingType) {
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
        const returnRedirect: string | null = await checkredirect(basicInfo.siteId, basicInfo.storyTitle)
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
        const basicInfo = geIdentiflyUrl(linkData.url)
        const urlBase: string = allSites[basicInfo.siteId].siteProperties.feedDomainURL as string
        const pathUrl = new URL(linkData.url)
        let arcRedirectSearch = await checkRedirect(basicInfo.siteId, pathUrl.pathname)
        if (await arcRedirectSearch !== null) {
          linkData.probableSolution = arcRedirectSearch?.match('/') !== null ? urlBase + (arcRedirectSearch !== null ? arcRedirectSearch : '') : arcRedirectSearch
          linkData.solution = ['redirect']
          linkData.status = 'olderRedirect'
          findUrl.push(linkData)
        } else {
          if (pathUrl.pathname.match(/\/$/) !== null) {
            arcRedirectSearch = await checkRedirect(basicInfo.siteId, pathUrl.pathname.replace(/.$/, ''))
          } else {
            arcRedirectSearch = await checkRedirect(basicInfo.siteId, `${pathUrl.pathname}/`)
          }
          if (await arcRedirectSearch !== null) {
            const root: string = arcRedirectSearch?.match('/') !== null ? urlBase : ''
            linkData.probableSolution = root + (arcRedirectSearch !== null ? arcRedirectSearch : '')
            linkData.solution = ['redirect']
            linkData.status = 'olderRedirect'
            findUrl.push(linkData)
          }
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
            const currentUrl: string | null = await checkredirect(urlClear.siteId, urlClear.storyTitle)
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
        if (rowData.status === 'process' && rowData.httpStatus === 404) {
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
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
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

export const checkUrlInGoogleFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
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
      } else {
        console.log('No se encontrarons links en Google.')
      }
    }
    return urlList
  } catch (error) {
    console.error(error)
    return null
  }
}

export const checkUrlInArcRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    if (await rows !== undefined && await rows !== null) {
      const options: filterOptions = {
        httpStatus: 400,
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
      } else {
        console.log('No se encontrarons redireccionamientos en Arc.')
      }
    }
    return urlList
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
        type: 'tag',
        status: 'none'
      }

      const clearTagsList = genericFilter(rows, options)
      console.log('clear tags ====>', await clearTagsList)
      if (clearTagsList.length > 0) {
        for (const tagLink of clearTagsList) {
          if (tagLink.url !== null) {
            const URI = new URL(tagLink.url)
            const segmentedUrl = URI.pathname.split('/')
            const lastValue = URI.pathname.match(/\/$/) !== null ? segmentedUrl.length - 2 : segmentedUrl.length - 1
            console.log(segmentedUrl[lastValue])
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
