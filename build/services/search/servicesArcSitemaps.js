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
exports.searchAndUpdateSitemapsInSheets = exports.searchSitemaps = void 0;
const googleSheets_1 = require("../../subscribers/googleSheets");
const searchInSitemaps_1 = require("../../subscribers/searchInSitemaps");
const allSites_1 = require("../../utils/allSites");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const searchSitemaps = (rowData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (rowData.url !== null) {
        const datePattern = /[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g;
        const dateArticle = (_a = rowData.url) === null || _a === void 0 ? void 0 : _a.match(datePattern);
        if (dateArticle !== null) {
            const date = datePattern.exec(rowData.url);
            const basicInfo = (0, genericUtils_1.geIdentiflyUrl)(rowData.url);
            const hostName = (_b = allSites_1.allSites[basicInfo.siteId]) === null || _b === void 0 ? void 0 : _b.siteProperties.feedDomainURL;
            if (hostName !== undefined && date !== null && basicInfo.storyTitle.length > 0) {
                let dateFilter = date[0];
                if (rowData.url.split(datePattern).length > 2) {
                    let myArray;
                    while ((myArray = datePattern.exec(rowData.url)) !== null) {
                        dateFilter = myArray[0];
                    }
                }
                const feedUrl = `${hostName}/arc/outboundfeeds/sitemap/${dateFilter.replace(/\//g, '-')}?outputType=xml`;
                const result = yield (0, searchInSitemaps_1.searchInSitemapByDate)(feedUrl, basicInfo.storyTitle);
                if ((yield result) !== null) {
                    rowData.solution = ['redirect'];
                    rowData.probableSolution = `${hostName}${result !== null && result !== void 0 ? result : ''}`;
                    const year = Number(dateArticle[0].split('/')[0]);
                    if (year >= 2022) {
                        rowData.status = 'arcTime';
                    }
                    else if (year >= 2016) {
                        rowData.status = 'recent';
                    }
                    else {
                        rowData.status = 'date';
                    }
                    return (rowData);
                }
            }
        }
    }
    return null;
});
exports.searchSitemaps = searchSitemaps;
const searchSitemapInBucle = (rows) => __awaiter(void 0, void 0, void 0, function* () {
    const rowsOfRedirect = [];
    let key = 0;
    const progressRevisionOfSearch = (0, barUtils_1.searchBarConfig)('Search URL in sitemaps');
    progressRevisionOfSearch.start(rows.length, 0);
    for (const urlValidate of rows) {
        const existInSitemap = yield (0, exports.searchSitemaps)(urlValidate);
        if (existInSitemap !== null) {
            rowsOfRedirect.push(existInSitemap);
        }
        key++;
        progressRevisionOfSearch.update(key);
    }
    progressRevisionOfSearch.stop();
    return rowsOfRedirect;
});
const searchAndUpdateSitemapsInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const urlList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        if (rows !== undefined && rows !== null) {
            const options = {
                httpStatus: 400,
                method: null,
                type: 'any',
                status: 'none'
            };
            const storiesList = (0, genericUtils_1.genericFilter)(rows, options);
            const rowsOfRedirect = yield searchSitemapInBucle(storiesList);
            if ((yield rowsOfRedirect.length) > 0) {
                const barText = {
                    firstText: 'Guardando urls encontradas por fechas',
                    lastText: 'Url guardadas.'
                };
                yield (0, googleSheets_1.updateAgroupOfValuesInSheet)(sheetId, rowsOfRedirect, barText);
                return rowsOfRedirect;
            }
            else {
                console.log('No se encontrarons links con fechas');
            }
        }
        return urlList;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.searchAndUpdateSitemapsInSheets = searchAndUpdateSitemapsInSheets;
