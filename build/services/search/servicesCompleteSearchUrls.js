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
exports.searchAndUpdatePosibilitiesInSheets = exports.searchByUrl = exports.searchPosibilitiesBucle = void 0;
const googleSheets_1 = require("../../subscribers/googleSheets");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const servicesArcCirculate_1 = require("./servicesArcCirculate");
const servicesArcRedirects_1 = require("./servicesArcRedirects");
const servicesArcSection_1 = require("./servicesArcSection");
const servicesArcSitemaps_1 = require("./servicesArcSitemaps");
const servicesArcTags_1 = require("./servicesArcTags");
const servicesMetroSearch_1 = require("./servicesMetroSearch");
const searchPosibilities = (linkData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    if (linkData.url !== null && linkData.status === 'none') {
        switch (linkData.typeOfUrl) {
            case 'search':
                linkData.probableSolution = '/buscador/';
                return linkData;
            case 'tag':
                return yield (0, servicesArcTags_1.searchTag)(linkData, true);
            case 'rare':
                let tempRare = (_b = (_a = yield (0, servicesArcSection_1.searchSection)(linkData)) !== null && _a !== void 0 ? _a : yield (0, servicesArcTags_1.searchTag)(linkData, false)) !== null && _b !== void 0 ? _b : yield (0, servicesMetroSearch_1.searchMetro)(linkData);
                return tempRare;
            case 'redirect':
            case 'story':
            case 'video':
            case 'gallery':
            case 'any':
                let tempAny = (_e = (_d = (_c = yield (0, servicesArcRedirects_1.searchRedirect)(linkData)) !== null && _c !== void 0 ? _c : yield (0, servicesArcSitemaps_1.searchSitemaps)(linkData)) !== null && _d !== void 0 ? _d : yield (0, servicesMetroSearch_1.searchMetro)(linkData)) !== null && _e !== void 0 ? _e : yield (0, servicesArcCirculate_1.searchCirculate)(linkData);
                return tempAny;
            default:
                return null;
        }
    }
    return null;
});
const searchPosibilitiesBucle = (itemList) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nStart to search:');
    const tempArrayLinks = [];
    if (itemList.length > 0) {
        for (const item of itemList) {
            let tempData = yield searchPosibilities(item);
            if (tempData !== null) {
                tempArrayLinks.push(tempData);
            }
        }
    }
    return tempArrayLinks;
});
exports.searchPosibilitiesBucle = searchPosibilitiesBucle;
const searchByUrl = (url) => __awaiter(void 0, void 0, void 0, function* () {
    let tempData = yield (0, genericUtils_1.fetchData)(url);
    tempData.position = 0;
    return yield searchPosibilities(tempData);
});
exports.searchByUrl = searchByUrl;
const searchAndUpdatePosibilitiesInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        if (rows !== undefined && rows !== null) {
            let key = 0;
            const results = [];
            const start = new Date().getTime();
            const progressRevision = (0, barUtils_1.checkBarConfig)('Search URL', 'check URL\'s');
            progressRevision.start(rows.length, 0);
            for (const info of rows) {
                const linkData = (0, genericUtils_1.getSimpleLinkValues)(info, key);
                let tempValues = yield searchPosibilities(linkData);
                if (tempValues !== null) {
                    (0, googleSheets_1.updateRowData)(sheetId, 'Output', tempValues.position, tempValues);
                    results.push(tempValues);
                    yield (0, genericUtils_1.delay)(1000);
                }
                key++;
                progressRevision.update(key);
            }
            progressRevision.stop();
            const end = (new Date().getTime() - start) / 60000;
            console.log('\nTiempo de ejecución ===>', end, ' min.\n');
            return results;
        }
        else {
            console.log('No se modificaron celdas.');
            return null;
        }
    }
    catch (_error) {
        //console.error(error)
        return null;
    }
});
exports.searchAndUpdatePosibilitiesInSheets = searchAndUpdatePosibilitiesInSheets;
