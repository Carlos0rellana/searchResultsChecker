import { accessToGoogleSheets, updateRowData } from '../subscribers/googleSheets'
import { geIdentiflyUrl, getSimpleLinkValues } from '../utils/generic_utils'
import { linkValues, modLinkValues } from '../types/urlToVerify'
// import sitesData from '../config/static_data/blocks.json'

import cliProgress from 'cli-progress'
import colors from 'ansi-colors'
import { deleteRedirect, makeRedirect } from '../subscribers/arcRedirects'

// const allSites: SitesList = sitesData as SitesList

export const proccessRedirectsFromSheets = async (sheetId: string): Promise<linkValues[]|null> => {
  try {
    const urlList: linkValues[] = []
    const rows = await accessToGoogleSheets(sheetId, 'Output')
    const rowsOfRedirect: modLinkValues[] = []
    let firstRedirect: string|boolean = false
    let lastRedirect: string|boolean = false
    const progressRevision = new cliProgress.SingleBar({
      format: `Redirect Progress | ${colors.green('{bar}')} | {percentage}% || {value}/{total} Redirects`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    })
    if (rows !== undefined && rows !== null) {
      let progressCount: number = 1
      let key: number = 0
      for (const urlValidate of rows) {
        const rowData: modLinkValues = getSimpleLinkValues(urlValidate, key)
        if (rowData.status === 'process' && rowData.solution?.includes('redirect') !== false && rowData.httpStatus === 404) {
          rowsOfRedirect.push(rowData)
        }
        key++
      }
      progressRevision.start(rowsOfRedirect.length, 0)
      for (const item of rowsOfRedirect) {
        if (item.url !== null && item.url !== 'undefined' && item.url.length > 5 && item.solution !== null && item.probableSolution !== null) {
          const URI = new URL(item.url)
          const earlyUrl = geIdentiflyUrl(item.url)
          const externalLink: linkValues = item as linkValues
          const redirectTo: string = item.probableSolution
          const originPath: string = URI.pathname
          firstRedirect = await makeRedirect(earlyUrl.siteId, originPath, redirectTo)
          if (originPath.match(/\/$/) != null) {
            lastRedirect = await makeRedirect(earlyUrl.siteId, originPath.replace(/\/$/, ''), redirectTo)
          } else {
            lastRedirect = await makeRedirect(earlyUrl.siteId, `${originPath}/`, redirectTo)
          }
          if (await firstRedirect !== false || await lastRedirect !== false) {
            externalLink.status = 'waiting-ok'
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
        if (rowData.status === 'none' && rowData.solution?.includes('clear') !== false && rowData.httpStatus === 404) {
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
