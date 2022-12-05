import Typo from 'typo-js'
import { ortographyChecker } from '../types/urlToVerify'

const dictionary = new Typo('es_ES', null, null, { dictionaryPath: 'typo/dictionaries' })

const checkVocals = (letter: string): string => {
  return letter
    .replace('a', 'á').replace('A', 'Á')
    .replace('e', 'é').replace('E', 'É')
    .replace('i', 'í').replace('I', 'Í')
    .replace('o', 'ó').replace('O', 'Ó')
    .replace('u', 'ú').replace('U', 'Ú')
}

const bucleConfirm = (word: string): string => {
  for (let letter = 0; letter < word.length; letter++) {
    if (word[letter].match(/^[aeiouúAEIOUÚ]/) !== null) {
      const currentWord = word.substring(0, letter) + checkVocals(word[letter]) + word.substring(letter + 1)
      if (dictionary.check(currentWord)) {
        return currentWord
      }
    }
  }
  return word
}

const validateWordGenerator = (word: string): string => {
  const currentWord = bucleConfirm(word)
  if (currentWord === word && word.match(/gu[ei]/) !== null) {
    const dieresisWord = word.replace('gue', 'güe').replace('GUE', 'GÜE').replace('gui', 'güi').replace('GUI', 'GÜI')
    if (dictionary.check(dieresisWord)) {
      return dieresisWord
    } else {
      const checking = bucleConfirm(dieresisWord)
      if (checking !== dieresisWord) {
        return checking
      }
    }
  }
  return currentWord
}

export const getAsyncWebGrammarly = (phrase: string): ortographyChecker => {
  const phraseWordList = phrase.split(' ')
  let outputPhrase: string = ''
  let step = 0
  for (const word of phraseWordList) {
    const separator = step < phraseWordList.length - 1 ? ' ' : ''
    const checkWord = dictionary.check(word)
    if (!checkWord) {
      outputPhrase += validateWordGenerator(word)
    } else {
      outputPhrase += word
    }
    outputPhrase += separator
    step++
  }
  return { origin: phrase, mod: outputPhrase }
}
