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
exports.searchAndUpdateMetroInSheets = exports.searchMetroBucle = exports.searchMetro = void 0;
const getArticleRedirectFromPublimetroDB_1 = require("../../subscribers/getArticleRedirectFromPublimetroDB");
const googleSheets_1 = require("../../subscribers/googleSheets");
const allSites_1 = require("../../utils/allSites");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const searchMetro = (linkData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (linkData.url !== null) {
        const basicInfo = (0, genericUtils_1.geIdentiflyUrl)(linkData.url);
        const returnRedirect = yield (0, getArticleRedirectFromPublimetroDB_1.checkMetroDB)(basicInfo.siteId, basicInfo.storyTitle);
        if ((yield returnRedirect) !== null && ((_b = (_a = allSites_1.allSites[basicInfo.siteId]) === null || _a === void 0 ? void 0 : _a.siteProperties) === null || _b === void 0 ? void 0 : _b.feedDomainURL) !== undefined) {
            if ((returnRedirect === null || returnRedirect === void 0 ? void 0 : returnRedirect.match('/')) !== null) {
                const urlBase = allSites_1.allSites[basicInfo.siteId].siteProperties.feedDomainURL;
                linkData.probableSolution = urlBase + (returnRedirect !== null ? returnRedirect : '');
                linkData.solution = ['redirect'];
                linkData.status = 'metro';
                return linkData;
            }
        }
    }
    return null;
});
exports.searchMetro = searchMetro;
const searchMetroBucle = (itemList) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nStart to search in Metro DB:');
    const findUrl = [];
    if (itemList.length > 0) {
        let key = 0;
        const progressRevisionOfSearch = (0, barUtils_1.searchBarConfig)('Search in Metro DB');
        progressRevisionOfSearch.start(itemList.length, 0);
        for (const linkData of itemList) {
            const tempData = yield (0, exports.searchMetro)(linkData);
            if (tempData !== null) {
                findUrl.push(tempData);
                progressRevisionOfSearch.update(key);
                yield (0, genericUtils_1.delay)(2000);
            }
            key++;
        }
        progressRevisionOfSearch.stop();
    }
    return findUrl;
});
exports.searchMetroBucle = searchMetroBucle;
const searchAndUpdateMetroInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
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
            const rowsToSaveInSheet = yield (0, exports.searchMetroBucle)(rowsOfRedirect);
            if ((yield rowsToSaveInSheet.length) > 0) {
                const barText = {
                    firstText: 'Update status URL in GoogleSheets',
                    lastText: 'Url encontradas.'
                };
                yield (0, googleSheets_1.updateAgroupOfValuesInSheet)(sheetId, rowsToSaveInSheet, barText);
                return rowsOfRedirect;
            }
            else {
                console.log('No se encontrarons links en base de datos de metro');
            }
        }
        return null;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.searchAndUpdateMetroInSheets = searchAndUpdateMetroInSheets;
