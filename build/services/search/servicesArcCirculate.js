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
exports.searchAndUpdateCirculateInSheets = exports.searchInArcCirculate = exports.searchCirculate = void 0;
const arcSearch_1 = require("../../subscribers/arcSearch");
const googleSheets_1 = require("../../subscribers/googleSheets");
const allSites_1 = require("../../utils/allSites");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const searchCirculate = (linkData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (linkData.url !== null) {
        const basicInfo = (0, genericUtils_1.geIdentiflyUrl)(linkData.url);
        const findURLinArc = yield (0, arcSearch_1.searchInBucleArc)(basicInfo.siteId, basicInfo.storyTitle);
        if ((yield findURLinArc.id) !== undefined && ((_b = (_a = allSites_1.allSites[findURLinArc.site]) === null || _a === void 0 ? void 0 : _a.siteProperties) === null || _b === void 0 ? void 0 : _b.feedDomainURL) !== undefined) {
            const checkOrigin = basicInfo.siteId === findURLinArc.site;
            const rootUrl = (allSites_1.allSites[findURLinArc.site].siteProperties.feedDomainURL.length > 0) ? allSites_1.allSites[findURLinArc.site].siteProperties.feedDomainURL : '';
            linkData.probableSolution = checkOrigin ? findURLinArc.url : rootUrl + findURLinArc.url;
            linkData.solution = checkOrigin ? ['redirect'] : ['re-circulate'];
            if (findURLinArc.isTitleByIteration) {
                linkData.status = 'searchByTitle';
            }
            else {
                linkData.status = findURLinArc.id.match('_redirect_') === null ? 'circulate' : 'findUrlWithRedirectTo';
            }
            return linkData;
        }
    }
    return null;
});
exports.searchCirculate = searchCirculate;
const searchInArcCirculate = (itemList) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nStart to search in Arc Sites:');
    const findUrl = [];
    if (itemList.length > 0) {
        let key = 0;
        const progressRevisionOfSearch = (0, barUtils_1.searchBarConfig)('Search in Arc Sites');
        progressRevisionOfSearch.start(itemList.length, 0);
        for (const linkData of itemList) {
            const tempData = yield (0, exports.searchCirculate)(linkData);
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
exports.searchInArcCirculate = searchInArcCirculate;
const searchAndUpdateCirculateInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
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
            const rowsToSaveInSheet = yield (0, exports.searchInArcCirculate)(rowsOfRedirect);
            if ((yield rowsToSaveInSheet.length) > 0) {
                const barText = {
                    firstText: 'Update status URL in GoogleSheets',
                    lastText: 'Url encontradas en sitios de Arc.'
                };
                yield (0, googleSheets_1.updateAgroupOfValuesInSheet)(sheetId, rowsToSaveInSheet, barText);
                return rowsToSaveInSheet;
            }
            else {
                console.log('No se encontrarons URL`s en Arc.');
            }
        }
        return null;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.searchAndUpdateCirculateInSheets = searchAndUpdateCirculateInSheets;
