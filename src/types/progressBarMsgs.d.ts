import color from 'ansi-colors'

export interface msgProgressBar {
  firstText: string
  lastText: string
}

export interface barConfig extends msgProgressBar{
  colorConfig: color.StyleFunction
}
