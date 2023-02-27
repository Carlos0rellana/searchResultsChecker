"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAListOfPossiblesTitles = exports.getAsyncWebGrammarly = void 0;
const typo_js_1 = __importDefault(require("typo-js"));
const dictionary = new typo_js_1.default('es_ES', null, null, { dictionaryPath: 'typo/dictionaries' });
const checkVocals = (letter) => {
    return letter
        .replace('a', 'á').replace('A', 'Á')
        .replace('e', 'é').replace('E', 'É')
        .replace('i', 'í').replace('I', 'Í')
        .replace('o', 'ó').replace('O', 'Ó')
        .replace('u', 'ú').replace('U', 'Ú');
};
const bucleConfirm = (word) => {
    for (let letter = 0; letter < word.length; letter++) {
        if (word[letter].match(/^[aeiouúAEIOUÚ]/) !== null) {
            const currentWord = word.substring(0, letter) + checkVocals(word[letter]) + word.substring(letter + 1);
            if (dictionary.check(currentWord)) {
                return currentWord;
            }
        }
    }
    return word;
};
const bucleGeneratorTitles = (word) => {
    const result = [];
    result.push(word);
    for (let letter = 0; letter < word.length; letter++) {
        if (word[letter].match(/^[aeiouúAEIOUÚ]/) !== null) {
            const currentWord = word.substring(0, letter) + checkVocals(word[letter]) + word.substring(letter + 1);
            console.log(currentWord);
            if (dictionary.check(currentWord)) {
                result.push(currentWord);
            }
        }
    }
    return result;
};
const validateWordGenerator = (word) => {
    const currentWord = bucleConfirm(word);
    if (currentWord === word && word.match(/gu[ei]/) !== null) {
        const dieresisWord = word.replace('gue', 'güe').replace('GUE', 'GÜE').replace('gui', 'güi').replace('GUI', 'GÜI');
        if (dictionary.check(dieresisWord)) {
            return dieresisWord;
        }
        else {
            const checking = bucleConfirm(dieresisWord);
            if (checking !== dieresisWord) {
                return checking;
            }
        }
    }
    return currentWord;
};
const getAsyncWebGrammarly = (phrase) => {
    const phraseWordList = phrase.split(' ');
    let outputPhrase = '';
    let step = 0;
    for (const word of phraseWordList) {
        const separator = step < phraseWordList.length - 1 ? ' ' : '';
        const checkWord = dictionary.check(word);
        if (!checkWord) {
            outputPhrase += validateWordGenerator(word);
        }
        else {
            outputPhrase += word;
        }
        outputPhrase += separator;
        step++;
    }
    return { origin: phrase, mod: outputPhrase };
};
exports.getAsyncWebGrammarly = getAsyncWebGrammarly;
const getAListOfPossiblesTitles = (phrase) => {
    const phraseWordList = phrase.split(' ');
    let result = [];
    for (const word of phraseWordList) {
        const words = bucleGeneratorTitles(word);
        result = generaRespuesta(result, words);
    }
    const respuesta = [];
    for (let x = 0; x < result.length; x++) {
        const resultado = result[x];
        let frase = '';
        for (let y = 0; y < resultado.length; y++) {
            const palabra = resultado[y];
            if (y === 0) {
                frase = palabra;
            }
            else {
                frase = frase + ' ' + palabra;
            }
        }
        respuesta.push(frase);
    }
    return { origin: phrase, result: respuesta };
};
exports.getAListOfPossiblesTitles = getAListOfPossiblesTitles;
const generaRespuesta = (respuesta, words) => {
    // console.log('function generaRespuesta', respuesta, words)
    const result = [];
    if (respuesta.length > 0) {
        for (let x = 0; x < respuesta.length; x++) {
            let output;
            const registro = respuesta[x];
            for (let y = 0; y < words.length; y++) {
                const word = words[y];
                output = registro.concat([word]);
                result.push(output);
            }
        }
    }
    else {
        for (const word of words) {
            result.push([word]);
        }
    }
    return result;
};
