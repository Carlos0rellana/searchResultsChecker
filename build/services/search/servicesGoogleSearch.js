"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAndUpdateGoogleInSheets = exports.check404inGoogle = void 0;
const googleApiSearch_1 = require("../../subscribers/googleApiSearch");
const googleSheets_1 = require("../../subscribers/googleSheets");
const allSites_1 = require("../../utils/allSites");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const searchInGoogle = (itemList) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nStart to search in Google:');
    const findUrl = [];
    if (itemList.length > 0) {
        let key = 0;
        const progressRevisionOfSearch = (0, barUtils_1.searchBarConfig)('Search in Google');
        progressRevisionOfSearch.start(itemList.length, 0);
        for (const linkData of itemList) {
            if (linkData.url !== null) {
                const basicInfo = (0, genericUtils_1.geIdentiflyUrl)(linkData.url);
                const googleSearch = yield (0, googleApiSearch_1.searchInGoogleServiceApi)(basicInfo.siteId, basicInfo.storyTitle);
                if ((yield googleSearch) !== null && googleSearch === 'Too Many Requests') {
                    progressRevisionOfSearch.update(key);
                    progressRevisionOfSearch.stop();
                    console.log('Se llega al limite de busquedas en GOOGLE.');
                    return findUrl;
                }
                if ((yield googleSearch) !== null && googleSearch !== 'Too Many Requests') {
                    const urlBase = allSites_1.allSites[basicInfo.siteId].siteProperties.feedDomainURL;
                    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                    linkData.probableSolution = urlBase + googleSearch;
                    linkData.solution = ['redirect'];
                    linkData.status = 'google';
                    findUrl.push(linkData);
                }
                progressRevisionOfSearch.update(key);
                yield (0, genericUtils_1.delay)(2000);
            }
            key++;
        }
        progressRevisionOfSearch.stop();
    }
    return findUrl;
});
const check404inGoogle = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        const currentListModValues = [];
        const progressRevision = (0, barUtils_1.checkBarConfig)('LocalRedirects Ckeck\'s', 'Local\'s Checks');
        if (rows !== null) {
            let key = 0;
            progressRevision.start(rows.length, 0);
            for (const row of rows) {
                const rowData = (0, genericUtils_1.getSimpleLinkValues)(row, key);
                if (rowData.typeOfUrl === 'story' && rowData.httpStatus === 404 && rowData.status === 'none') {
                    let urlClear = null;
                    if (rowData.probableSolution !== null && rowData.probableSolution !== 'null' && rowData.probableSolution.length > 0 && rowData.status === 'none') {
                        urlClear = (0, genericUtils_1.geIdentiflyUrl)(rowData.probableSolution);
                    }
                    else if (rowData.url !== null && rowData.url !== 'null' && rowData.url.length > 0) {
                        urlClear = (0, genericUtils_1.geIdentiflyUrl)(rowData.url);
                    }
                    if (urlClear !== null && urlClear.storyTitle !== 'null' && rowData.status === 'none' && urlClear.storyTitle.length > 0) {
                        const urlSite = allSites_1.allSites[urlClear.siteId].siteProperties.feedDomainURL;
                        if (urlSite !== null && urlSite !== undefined) {
                            const googleSearch = yield (0, googleApiSearch_1.searchInGoogleServiceApi)(urlClear.siteId, urlClear.storyTitle);
                            if (googleSearch !== null) {
                                rowData.probableSolution = googleSearch;
                                rowData.solution = ['redirect'];
                                rowData.status = 'google';
                                currentListModValues.push(rowData);
                                const linkData = rowData;
                                yield (0, googleSheets_1.updateRowData)(sheetId, 'Output', rowData.position, linkData);
                            }
                        }
                        yield (0, genericUtils_1.delay)(2000);
                    }
                }
                key++;
                progressRevision.update(key);
            }
        }
        progressRevision.stop();
        return currentListModValues;
    }
    catch (error) {
        console.error(error);
    }
    return null;
});
exports.check404inGoogle = check404inGoogle;
const searchAndUpdateGoogleInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        if ((yield rows) !== undefined && (yield rows) !== null) {
            const options = {
                httpStatus: 400,
                method: null,
                type: 'any',
                status: 'none'
            };
            const rowsOfRedirect = (0, genericUtils_1.genericFilter)(rows, options);
            const rowsToSaveInSheet = yield searchInGoogle(rowsOfRedirect);
            if ((yield rowsToSaveInSheet.length) > 0) {
                const barText = {
                    firstText: 'Update status URL in GoogleSheets',
                    lastText: 'Url encontradas.'
                };
                yield (0, googleSheets_1.updateAgroupOfValuesInSheet)(sheetId, rowsToSaveInSheet, barText);
                return rowsToSaveInSheet;
            }
            else {
                console.log('No se encontrarons links en Google.');
            }
        }
        return null;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.searchAndUpdateGoogleInSheets = searchAndUpdateGoogleInSheets;
