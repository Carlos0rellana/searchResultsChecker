import Typo from 'typo-js'
import { ortographyChecker, ortographyChecker_ } from '../types/urlToVerify'

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

const bucleConfirm_ = (word: string): any[] => {
  const result: any[] = []
  result.push(word)
  for (let letter = 0; letter < word.length; letter++) {
    if (word[letter].match(/^[aeiouúAEIOUÚ]/) !== null) {
      const currentWord = word.substring(0, letter) + checkVocals(word[letter]) + word.substring(letter + 1)
      if (dictionary.check(currentWord)) {
        result.push(currentWord)
      }
    }
  }
  return result
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

const validateWordGenerator_ = (word: string): any[] => {
  const currentWord = bucleConfirm_(word)
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

export const getAsyncWebGrammarly_ = (phrase: string): ortographyChecker_ => {
  const phraseWordList = phrase.split(' ')
  let result: any = []
  for (const word of phraseWordList) {
    const words = validateWordGenerator_(word)
    result = generaRespuesta(result, words)
  }
  const respuesta: any[] = []
  for (let x = 0; x < result.length; x++) {
    const resultado: any[] = result[x]
    let frase: string = ''
    for (let y = 0; y < resultado.length; y++) {
      const palabra: string = resultado[y]
      if (y === 0) {
        frase = palabra
      } else {
        frase = frase + ' ' + palabra
      }
    }
    respuesta.push(frase)
  }
  return { origin: phrase, result: respuesta }
}

const generaRespuesta = (respuesta: any[], words: any[]): any[] => {
  // console.log('function generaRespuesta', respuesta, words)
  const result: any[] = []
  if (respuesta.length > 0) {
    for (let x = 0; x < respuesta.length; x++) {
      let output: any[]
      const registro: any[] = respuesta[x]
      for (let y = 0; y < words.length; y++) {
        const word: String = words[y]
        output = registro.concat([word])
        result.push(output)
      }
    }
  } else {
    for (const word of words) {
      result.push([word])
    }
  }
  return result
}
