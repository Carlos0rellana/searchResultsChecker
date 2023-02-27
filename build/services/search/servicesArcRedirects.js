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
exports.searchAndUpdateRedirectsInSheets = exports.searchAndUpdateExternalRedirectsInSheets = exports.checkRedirectsFromSheets = exports.searchRedirect = void 0;
const arcRedirects_1 = require("../../subscribers/arcRedirects");
const googleSheets_1 = require("../../subscribers/googleSheets");
const allSites_1 = require("../../utils/allSites");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const searchRedirect = (linkData) => __awaiter(void 0, void 0, void 0, function* () {
    if (linkData.url !== null) {
        const basicInfo = (0, genericUtils_1.geIdentiflyUrl)((0, genericUtils_1.sanitizePathToWWWWpath)(linkData.url));
        const urlBase = allSites_1.allSites[basicInfo.siteId].siteProperties.feedDomainURL;
        const pathUrl = new URL(linkData.url);
        let urlContest = pathUrl.pathname;
        if (linkData.status === 'findUrlWithRedirectTo' && linkData.probableSolution !== null) {
            urlContest = linkData.probableSolution;
        }
        let arcRedirectSearch = yield (0, arcRedirects_1.checkRedirect)(basicInfo.siteId, urlContest);
        if ((yield arcRedirectSearch) !== null) {
            linkData.probableSolution = (arcRedirectSearch === null || arcRedirectSearch === void 0 ? void 0 : arcRedirectSearch.match('/')) !== null ? urlBase + (arcRedirectSearch !== null ? arcRedirectSearch : '') : arcRedirectSearch;
            linkData.solution = ['redirect'];
            linkData.status = 'olderRedirect';
            return (linkData);
        }
        else {
            if (pathUrl.pathname.match(/\/$/) !== null) {
                arcRedirectSearch = yield (0, arcRedirects_1.checkRedirect)(basicInfo.siteId, urlContest.replace(/.$/, ''));
            }
            else {
                arcRedirectSearch = yield (0, arcRedirects_1.checkRedirect)(basicInfo.siteId, `${urlContest}/`);
            }
            if ((yield arcRedirectSearch) !== null) {
                const root = (arcRedirectSearch === null || arcRedirectSearch === void 0 ? void 0 : arcRedirectSearch.match('/')) !== null ? urlBase : '';
                linkData.probableSolution = root + (arcRedirectSearch !== null ? arcRedirectSearch : '');
                linkData.solution = ['redirect'];
                linkData.status = 'olderRedirect';
                return (linkData);
            }
        }
    }
    return null;
});
exports.searchRedirect = searchRedirect;
const unificateUpdate = (sheetId, barsConfig, rows) => __awaiter(void 0, void 0, void 0, function* () {
    if (rows !== null) {
        const rowsOfRedirect = (0, genericUtils_1.genericFilter)(rows, barsConfig.filter);
        const rowsToSaveInSheet = yield searchRedirectsBucle(rowsOfRedirect);
        if ((yield rowsToSaveInSheet.length) > 0) {
            yield (0, googleSheets_1.updateAgroupOfValuesInSheet)(sheetId, rowsToSaveInSheet, barsConfig.update);
            return rowsToSaveInSheet;
        }
        else {
            console.log('No se encontrarons redireccionamientos en Arc.');
        }
    }
    return null;
});
const unificateCheckAndUpdate = (sheetId, configFilter) => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
    if ((yield rows) !== null) {
        const filterData = {
            httpStatus: configFilter.httpStatus,
            method: configFilter.method,
            type: configFilter.type,
            status: configFilter.status
        };
        const updateData = {
            firstText: 'Update status',
            lastText: 'Url encontradas.'
        };
        return yield unificateUpdate(sheetId, { filter: filterData, update: updateData }, rows);
    }
    return null;
});
const searchRedirectsBucle = (itemList) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nStart to search in Arc:');
    const findUrl = [];
    if (itemList.length > 0) {
        let key = 0;
        const progressRevisionOfSearch = (0, barUtils_1.searchBarConfig)('Search in Arc');
        progressRevisionOfSearch.start(itemList.length, 0);
        for (const linkData of itemList) {
            const tempValue = yield (0, exports.searchRedirect)(linkData);
            if (tempValue !== null) {
                findUrl.push(tempValue);
            }
            yield (0, genericUtils_1.delay)(1000);
            key++;
            progressRevisionOfSearch.update(key);
        }
        progressRevisionOfSearch.stop();
    }
    return findUrl;
});
const checkRedirectsFromSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const urlList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        const rowsOfRedirect = [];
        let redirect = null;
        const progressRevision = (0, barUtils_1.checkBarConfig)('Search redirects', 'Redirects find');
        if (rows !== undefined && rows !== null) {
            let progressCount = 1;
            let key = 0;
            for (const urlValidate of rows) {
                const rowData = (0, genericUtils_1.getSimpleLinkValues)(urlValidate, key);
                if ((rowData.status === 'process' || rowData.status === 'waiting-ok') &&
                    rowData.httpStatus !== null &&
                    rowData.httpStatus >= 400 &&
                    rowData.httpStatus < 500) {
                    rowsOfRedirect.push(rowData);
                }
                key++;
            }
            progressRevision.start(rowsOfRedirect.length, 0);
            for (const item of rowsOfRedirect) {
                if (item.url !== null) {
                    const URI = new URL(item.url);
                    const earlyUrl = (0, genericUtils_1.geIdentiflyUrl)(item.url);
                    const externalLink = item;
                    const originPath = URI.pathname;
                    redirect = yield (0, arcRedirects_1.checkRedirect)(earlyUrl.siteId, originPath);
                    const httpResponseCheck = yield (0, genericUtils_1.fetchData)(item.url);
                    if (typeof httpResponseCheck.httpStatus === 'number' && httpResponseCheck.httpStatus < 400 && item.url !== 'undefined') {
                        externalLink.status = 'ok';
                        yield (0, googleSheets_1.updateRowData)(sheetId, 'Output', item.position, externalLink);
                    }
                    else if (redirect !== null) {
                        externalLink.status = 'manual';
                        externalLink.probableSolution = redirect;
                        externalLink.solution = ['redirect', 'resolver'];
                        yield (0, googleSheets_1.updateRowData)(sheetId, 'Output', item.position, externalLink);
                    }
                }
                progressRevision.update(progressCount);
                progressCount++;
            }
            progressRevision.stop();
        }
        return urlList;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.checkRedirectsFromSheets = checkRedirectsFromSheets;
const searchAndUpdateExternalRedirectsInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filterData = {
            httpStatus: 400,
            method: 'redirect',
            type: 'any',
            status: 'findUrlWithRedirectTo'
        };
        return yield unificateCheckAndUpdate(sheetId, filterData);
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.searchAndUpdateExternalRedirectsInSheets = searchAndUpdateExternalRedirectsInSheets;
const searchAndUpdateRedirectsInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filterData = {
            httpStatus: 400,
            method: null,
            type: 'any',
            status: 'none'
        };
        return yield unificateCheckAndUpdate(sheetId, filterData);
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.searchAndUpdateRedirectsInSheets = searchAndUpdateRedirectsInSheets;
