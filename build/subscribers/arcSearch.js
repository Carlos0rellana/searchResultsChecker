"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchInBucleArc = void 0;
const axios_1 = __importDefault(require("axios"));
const access = __importStar(require("../config/tokenAccessArc.json"));
const blocks_json_1 = __importDefault(require("../config/static_data/blocks.json"));
const genericUtils_1 = require("../utils/genericUtils");
const grammarly_1 = require("../subscribers/grammarly");
const searchInArc = (siteId, searchQuery, from = '0', size = '100') => __awaiter(void 0, void 0, void 0, function* () {
    const returnValues = '_id,website_url,websites,canonical_url,headlines.basic,type';
    const config = {
        method: 'get',
        url: `https://api.metroworldnews.arcpublishing.com/content/v4/search/published?website=${siteId}&q=${searchQuery}&_sourceInclude=${returnValues}&from=${from}&size=${size}`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: access.token
        }
    };
    let query = null;
    let iteraciones = 0;
    while (query == null) {
        if (iteraciones > 10) {
            return null;
        }
        query = yield getData(config);
        iteraciones++;
    }
    const result = query.data;
    const isSearchByTitle = searchQuery.match(/headlines.basic:/) !== null;
    if (result.content_elements !== undefined && result.content_elements.length > 0) {
        const resultList = [];
        console.log(result);
        for (const story of result.content_elements) {
            const tempStory = restructureAarcSimpleStory(siteId, story, isSearchByTitle);
            resultList.push(tempStory);
        }
        console.log(resultList);
        return resultList;
    }
    else if (result.error_code !== undefined) {
        return null;
    }
    else {
        return null;
    }
});
const getData = (config) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, axios_1.default)(config);
        return result;
    }
    catch (err) {
        //console.log(err)
        return null;
    }
});
const reverseSearch = (siteId, search, compareOrder) => __awaiter(void 0, void 0, void 0, function* () {
    const searchQuery = `canonical_url:*${search}*`;
    if (siteId === compareOrder[0]) {
        const find = searchInArc(siteId, searchQuery);
        if ((yield find) === null) {
            return yield searchInArc(compareOrder[1], searchQuery);
        }
        return yield find;
    }
    return null;
});
const searchByTitle = (siteId, element) => __awaiter(void 0, void 0, void 0, function* () {
    // const title = getAsyncWebGrammarly(element.title.replace(/:/g, '\\:').replace(/"/g, '\\"'))
    let title = element.title;
    title = title.replace(/[:“”#\\]/g, '');
    const searchQuery = `headlines.basic:"${title}"+AND+type:"story"`;
    //console.log('searchQuery', searchQuery)
    const data = yield searchInArc(siteId, searchQuery);
    if (data !== null) {
        const result = restructureAarcSimpleStory(siteId, data.content_elements[0]);
        return result;
    }
    return false;
});
const restructureAarcSimpleStory = (siteId, searchResult, searchByTitle = false) => {
    var _a, _b, _c;
    let titleFromInput = 'No title, because is a redirect';
    if (searchResult._id.match(/_redirect_/) === null &&
        ((_a = searchResult === null || searchResult === void 0 ? void 0 : searchResult.headlines) === null || _a === void 0 ? void 0 : _a.basic) !== undefined) {
        titleFromInput = searchResult.headlines.basic;
    }
    const currentUrl = {
        url: (_c = (_b = searchResult.website_url) !== null && _b !== void 0 ? _b : searchResult.canonical_url) !== null && _c !== void 0 ? _c : 'NOT DEFINED URL',
        site: siteId,
        id: searchResult._id,
        type: searchResult.type,
        title: titleFromInput,
        isTitleByIteration: searchByTitle
    };
    return currentUrl;
};
const comparativeResult = (resultList, config, ratio = 0.8) => {
    let returnValue = false;
    if (resultList.content_elements !== undefined) {
        for (const element of resultList.content_elements) {
            if (element.canonical_url !== undefined) {
                const ratioValue = (0, genericUtils_1.ratioWords)(element.canonical_url, config);
                //console.log('ratioValue', ratioValue)
                if (returnValue === false && ratioValue >= ratio) {
                    const currentUrl = restructureAarcSimpleStory(config.siteId, element);
                    returnValue = [ratioValue, currentUrl];
                }
                if (returnValue !== false && ratioValue > returnValue[0]) {
                    const currentUrl = restructureAarcSimpleStory(config.siteId, element);
                    returnValue = [ratioValue, currentUrl];
                }
            }
        }
    }
    return returnValue;
};
const lookingForASite = (searchConfig) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`\nSearch in sites bucle ===> ${searchConfig.siteId}.....${searchConfig.search}`);
    let mainSiteSearch = yield searchInArc(searchConfig.siteId, searchConfig.search);
    if (mainSiteSearch !== null && mainSiteSearch.length > 0) {
        const elements = mainSiteSearch.length;
        console.log(mainSiteSearch);
        if (elements === 1) {
            return mainSiteSearch[0];
        }
        else {
            const config = {
                type: searchConfig.type,
                siteId: searchConfig.siteId,
                valueToSearch: searchConfig.search
            };
            const checkingItem = comparativeResult(mainSiteSearch, config);
            if ((checkingItem !== false && checkingItem.length > 0) || (checkingItem !== false && searchConfig.search.match('headlines.basic') !== null)) {
                return checkingItem[1];
            }
        }
    }
    return false;
});
const bucleSeachByTitleInSitesList = (siteId, search) => __awaiter(void 0, void 0, void 0, function* () {
    const allSites = blocks_json_1.default;
    const idListSites = Object.keys(allSites);
    let find = false;
    for (const localIdSite of idListSites) {
        if (localIdSite !== 'mwnbrasil' && localIdSite !== 'novamulher' && localIdSite !== siteId) {
            // const title = getAsyncWebGrammarly(search.title.replace(/:/g, '\\:').replace(/"/g, '\\"'))
            const title = (0, grammarly_1.getAsyncWebGrammarly)(search.title);
            search.title = title.mod;
            find = yield searchByTitle(localIdSite, search);
            if ((yield find) !== false) {
                return find;
            }
        }
    }
    return find;
});
const bucleSeachInSitesList = (siteId, search, currentPriority = false) => __awaiter(void 0, void 0, void 0, function* () {
    const allSites = blocks_json_1.default;
    const idListSites = Object.keys(allSites);
    let find = false;
    for (const localIdSite of idListSites) {
        console.log(`Buscando en el Sitio: ${localIdSite}`);
        if (localIdSite !== 'mwnbrasil' && localIdSite !== 'novamulher' && localIdSite !== siteId) {
            const searchQuery = `canonical_url:*${search}*`;
            const searchConfig = {
                siteId: localIdSite,
                search: searchQuery,
                type: 'url',
                priority: currentPriority
            };
            find = yield lookingForASite(searchConfig);
            console.log('\nCheck In Site=========>\n', yield find, '\n<=========\n');
            if ((yield find) !== false) {
                return find;
            }
        }
    }
    return find;
});
const searchInBucleArc = (siteId, search, currentPriority = false) => __awaiter(void 0, void 0, void 0, function* () {
    let find = false;
    if (siteId === 'mwnbrasil' || siteId === 'novamulher') {
        const compareList = siteId === 'mwnbrasil' ? ['mwnbrasil', 'novamulher'] : ['novamulher', 'mwnbrasil'];
        find = yield reverseSearch(siteId, search, compareList);
    }
    else {
        const searchQuery = `canonical_url:*${search}*`;
        const searchConfig = {
            siteId: siteId,
            search: searchQuery,
            type: 'url',
            priority: currentPriority
        };
        find = yield lookingForASite(searchConfig);
        if (find === false) {
            find = yield bucleSeachInSitesList(siteId, search, currentPriority);
        }
    }
    if (find !== false && currentPriority === false && ((find === null || find === void 0 ? void 0 : find.type) === 'gallery' || (find === null || find === void 0 ? void 0 : find.type) === 'video' || find.site !== siteId)) {
        const checkByTitle = yield searchByTitle(siteId, find);
        if (checkByTitle !== false) {
            return checkByTitle;
        }
        else {
            const returnValue = yield bucleSeachByTitleInSitesList(siteId, find);
            return returnValue;
        }
    }
    if (find === false) {
        const title = search.replace(/-/g, ' ');
        const generaTitulos = (0, grammarly_1.getAListOfPossiblesTitles)(title);
        console.log('\nStart search by all posibilities titles ');
        for (let x = 0; x < generaTitulos.result.length; x++) {
            const titulo = generaTitulos.result[x];
            const input = {
                headlines: { basic: titulo },
                canonical_url: 'no url',
                site: siteId,
                _id: 'no existe',
                type: 'story'
            };
            const element = restructureAarcSimpleStory(siteId, input);
            //process.stdout.write(`\r\nSearch by Title: ==>${titulo} ${x}/${generaTitulos.result.length}`)
            find = yield searchByTitle(siteId, element);
            if (find !== false) {
                find.isTitleByIteration = true;
                //process.stdout.write('\r')
                return find;
            }
        }
        //process.stdout.write('\r')
    }
    return find;
});
exports.searchInBucleArc = searchInBucleArc;
