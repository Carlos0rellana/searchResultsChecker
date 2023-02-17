import color from 'ansi-colors'

export interface msgProgressBar {
  description: string
  nameItems: string
}

export interface barConfig extends msgProgressBar{
  colorConfig: color.StyleFunction
}
