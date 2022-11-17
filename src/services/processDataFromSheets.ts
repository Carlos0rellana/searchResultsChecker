import { accessToGoogleSheets, updateRowData } from '../subscribers/googleSheets'
import { geIdentiflyUrl, getSimpleLinkValues } from '../utils/generic_utils'
import { linkValues, modLinkValues } from '../types/urlToVerify'
// import sitesData from '../config/static_data/blocks.json'

import cliProgress from 'cli-progress'
import colors from 'ansi-colors'
import { deleteRedirect, makeRedirect } from '../subscribers/arcRedirects'
import { makeAtagByslug } from '../subscribers/arcTags'

// const allSites: SitesList = sitesData as SitesList

export const proccessRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const rowsOfRedirect: modLinkValues[] = []
    let lastRedirect: string|false = false
    const progressRevision = new cliProgress.SingleBar({
      format: `Redirect Progress | ${colors.green('{bar}')} | {percentage}% || {value}/{total} Redirects`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== undefined && rows !== null) {
      let progressCount: number = 0
      let key: number = 0
      for (const urlValidate of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
        if (rowData.status === 'process' &&
            rowData.solution?.includes('redirect') !== false &&
            rowData.httpStatus !== null &&
            rowData.httpStatus >= 400 &&
            rowData.httpStatus < 499) {
          rowsOfRedirect.push(rowData)
        }
        key++
      }
      progressRevision.start(rowsOfRedirect.length, 0)
      for (const item of rowsOfRedirect) {
        if (item.url !== null &&
            item.url !== 'undefined' &&
            item.url.length > 5 &&
            item.solution !== null &&
            item.probableSolution !== null) {
          const URI = new URL(item.url)
          const earlyUrl = geIdentiflyUrl(item.url)
          const externalLink = item as linkValues
          const redirectTo: string = item.probableSolution
          const originPath: string = URI.pathname
          const firstRedirect = await makeRedirect(earlyUrl.siteId, originPath, redirectTo)
          if (originPath.match(/\/$/) !== null) {
            lastRedirect = await makeRedirect(earlyUrl.siteId, originPath.replace(/\/$/, ''), redirectTo)
            externalLink.status = 'waiting-ok'
          } else {
            lastRedirect = await makeRedirect(earlyUrl.siteId, `${originPath}/`, redirectTo)
            externalLink.status = 'waiting-ok'
          }
          if (await firstRedirect !== false || await lastRedirect !== false) {
            urlList.push(externalLink)
            console.log('testing')
            await updateRowData(sheetId, 'Output', item.position, externalLink)
          }
        }
        progressCount++
        progressRevision.update(progressCount)
      }
      progressRevision.stop()
    }
    return urlList
  } catch (_error) {
    // console.error(error)
    return null
  }
}

export const proccessTagsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const rowsOfRedirect: modLinkValues[] = []
    const progressRevision = new cliProgress.SingleBar({
      format: `Tags Progress | ${colors.green('{bar}')} | {percentage}% || {value}/{total} Tags`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== undefined && rows !== null) {
      let progressCount: number = 1
      let key: number = 0
      for (const urlValidate of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
        if (rowData.status === 'process' &&
            rowData.typeOfUrl === 'tag' &&
            rowData.solution?.includes('create') !== false &&
            rowData.httpStatus !== null &&
            rowData.httpStatus >= 400 &&
            rowData.httpStatus < 499) {
          rowsOfRedirect.push(rowData)
        }
        key++
      }
      progressRevision.start(rowsOfRedirect.length, 0)
      for (const item of rowsOfRedirect) {
        if (item.url !== null &&
            item.url !== 'undefined' &&
            item.url.length > 5 &&
            item.solution !== null &&
            item.probableSolution !== null) {
          const externalLink = item as linkValues
          if (await makeAtagByslug(item.probableSolution) === true) {
            externalLink.status = 'waiting-ok'
            await updateRowData(sheetId, 'Output', item.position, externalLink)
          }
        }
        progressCount++
        progressRevision.update(progressCount)
      }
      progressRevision.stop()
    }
    return urlList
  } catch (_error) {
    // console.error(error)
    return null
  }
}

export const deleteRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const rowsOfRedirect: modLinkValues[] = []
    let firstRedirect: string|boolean = false
    let lastRedirect: string|boolean = false
    const progressRevision = new cliProgress.SingleBar({
      format: `Clear Redirect Progress | ${colors.red('{bar}')} | {percentage}% || {value}/{total} Redirects`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== undefined && rows !== null) {
      let progressCount: number = 1
      let key: number = 0
      for (const urlValidate of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
        if (rowData.status === 'none' &&
            rowData.solution?.includes('clear') !== false &&
            rowData.httpStatus !== null &&
            rowData.httpStatus >= 400 &&
            rowData.httpStatus < 499) {
          rowsOfRedirect.push(rowData)
        }
        key++
      }
      progressRevision.start(rowsOfRedirect.length, 0)
      for (const item of rowsOfRedirect) {
        if (item.url !== null && item.solution !== null && item.probableSolution !== null) {
          const URI = new URL(item.url)
          const earlyUrl = geIdentiflyUrl(item.url)
          const externalLink: linkValues = item as linkValues
          const originPath: string = URI.pathname
          firstRedirect = await deleteRedirect(earlyUrl.siteId, originPath)
          if (originPath.match(/\/$/) != null) {
            lastRedirect = await deleteRedirect(earlyUrl.siteId, originPath.replace(/\/$/, ''))
          } else {
            lastRedirect = await deleteRedirect(earlyUrl.siteId, `${originPath}/`)
          }
          if (await firstRedirect && await lastRedirect) {
            externalLink.status = 'process'
            externalLink.solution = ['redirect']
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
