import cliProgress, { SingleBar } from 'cli-progress'
import colors from 'ansi-colors'
import { barConfig } from '../types/progressBarMsgs'

export const settingBar = (barConfig: barConfig): SingleBar => {
  return new cliProgress.SingleBar({
    format: `${barConfig.initText} | ${barConfig.colorConfig('{bar}')} | {percentage}% || {value}/{total} ${barConfig.endText}`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })
}

export const searchBarConfig = (searchText: string): SingleBar => {
  const barConfig = {
    colorConfig: colors.bgYellow,
    initText: searchText,
    endText: 'URLs'
  }
  return settingBar(barConfig)
}

export const checkBarConfig = (checkText: string, checkStatus: string): SingleBar => {
  const barConfig = {
    colorConfig: colors.bgGreen,
    initText: checkText,
    endText: checkStatus
  }
  return settingBar(barConfig)
}
