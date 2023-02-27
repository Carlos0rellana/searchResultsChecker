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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchData = exports.getSimpleLinkValues = exports.simpleRowData = exports.geIdentiflyUrl = exports.sanitizePathToWWWWpath = exports.delay = exports.ratioWords = exports.genericFilter = void 0;
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const axios_1 = __importDefault(require("axios"));
const blocks_json_1 = __importDefault(require("../config/static_data/blocks.json"));
const barUtils_1 = require("./barUtils");
const getGlobalContetType = (check) => {
    const find = 'Fusion.globalContent=';
    if (check.includes(find)) {
        const secondFind = ';';
        const firstStep = check.split(find)[1];
        if (firstStep.includes(secondFind)) {
            const globalContent = JSON.parse(firstStep.split(secondFind)[0]);
            if ('type' in globalContent) {
                return globalContent.type;
            }
            else if ('node_type' in globalContent) {
                return globalContent.node_type;
            }
            else if ('authors' in globalContent) {
                return 'author';
            }
            else if ('Payload' in globalContent) {
                return 'tag';
            }
            else {
                return globalContent;
            }
        }
        else {
            return null;
        }
    }
    else {
        return null;
    }
};
const rudimentaryUrlDistribution = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const pathRoute = new URL(url).pathname;
    const lengthPath = pathRoute.replace(/^\//, '').replace(/\/$/, '').split('/').length;
    if (lengthPath === 1) {
        return 'rare';
    }
    else if (pathRoute.match(/\/categor(y|ia)\//) !== null) {
        return 'section';
    }
    else if (pathRoute.match(/\/tags?\//g) != null) {
        return 'tag';
    }
    else if (pathRoute.match(/videos?/) !== null) {
        return 'video';
    }
    else if (pathRoute.match(/\/buscador\//) !== null) {
        return 'search';
    }
    else if ((pathRoute.match(/galerias?|fotos?/) != null)) {
        return 'gallery';
    }
    else if (pathRoute.match(/\/auth?or(es)?\/?/) != null) {
        return 'author';
    }
    else if (pathRoute.includes('.png') || pathRoute.includes('.xml') || pathRoute.includes('.jpeg') || pathRoute.includes('.jpg')) {
        return 'file';
    }
    else {
        return 'story';
    }
});
const getOutputTypeFromUrl = (url) => {
    let outputType = 'default';
    if (url.includes('outputType')) {
        const urlFragments = url.split('/').pop();
        if (urlFragments !== undefined) {
            const params = urlFragments.split('?')[1].split('&');
            params.map((value) => {
                if (value.includes('outputType')) {
                    outputType = value.replace('outputType', '').replace('?', '').replace('=', '').replace('"', '');
                }
                return outputType;
            });
        }
    }
    return outputType;
};
const genericFilter = (itemList, options) => {
    var _a;
    const result = [];
    if (itemList !== null && itemList.length > 0) {
        let key = 0;
        const barConfig = {
            colorConfig: ansi_colors_1.default.bgCyan,
            firstText: `Filter by ${options.type}`,
            lastText: `${options.type} URL checkeds`
        };
        const progressRevisionOfSearch = (0, barUtils_1.settingBar)(barConfig);
        console.log(`\nStart to filter by ${options.type}:`);
        progressRevisionOfSearch.start(itemList.length, 0);
        for (const info of itemList) {
            const linkData = (0, exports.getSimpleLinkValues)(info, key);
            const checkingType = options.type === 'any' ? (linkData.typeOfUrl === 'gallery' || linkData.typeOfUrl === 'story' || linkData.typeOfUrl === 'video' || linkData.typeOfUrl === 'search' || linkData.typeOfUrl === 'rare') : linkData.typeOfUrl === options.type;
            if (linkData.httpStatus !== null &&
                (options.method === null || ((_a = linkData.solution) === null || _a === void 0 ? void 0 : _a.includes(options.method)) === true) &&
                linkData.httpStatus < options.httpStatus + 99 &&
                linkData.httpStatus >= options.httpStatus &&
                linkData.status === options.status &&
                checkingType) {
                result.push(linkData);
            }
            key++;
            progressRevisionOfSearch.update(key);
        }
        progressRevisionOfSearch.stop();
    }
    return result;
};
exports.genericFilter = genericFilter;
const ratioWords = (variableUrl, item) => {
    const splitConfig = item.type === 'url' ? '-' : ' ';
    let countWords = 0;
    const urlCompleta = `${blocks_json_1.default[item.siteId].siteProperties.feedDomainURL} ${variableUrl}`;
    const urlArc = (0, exports.geIdentiflyUrl)(urlCompleta);
    const searchWordsInUrl = item.valueToSearch.split(splitConfig);
    const urlWordsToCompare = urlArc.storyTitle.split(splitConfig);
    for (const element of searchWordsInUrl) {
        if (urlWordsToCompare.includes(element.replace(/\*/gi, '').replace('canonical_url:', ''))) {
            countWords++;
        }
    }
    return (countWords / searchWordsInUrl.length);
};
exports.ratioWords = ratioWords;
const delay = (ms) => __awaiter(void 0, void 0, void 0, function* () {
    return yield new Promise(resolve => setTimeout(resolve, ms));
});
exports.delay = delay;
const sanitizePathToWWWWpath = (url, protocol = null) => {
    const formatToUrl = new URL(url);
    let hostRoute = formatToUrl.hostname.replace(/(origin|touch|dev|showbiz|juegos|mov)./, 'www.');
    if (hostRoute.match('www.') === null) {
        hostRoute = `www.${hostRoute}`;
    }
    const pre = protocol === null ? 'https://' : protocol;
    return (pre + hostRoute + formatToUrl.pathname);
};
exports.sanitizePathToWWWWpath = sanitizePathToWWWWpath;
const geIdentiflyUrl = (url) => {
    const site = {
        siteId: '',
        storyTitle: ''
    };
    url = (0, exports.sanitizePathToWWWWpath)(url);
    const URI = new URL(url);
    const segmentedUrl = URI.pathname.split('/');
    const roxen = /\/[\w]*\b!\b[\w]*\//;
    const galeria = /\/galeria\/$/;
    const video = /\/video\/$/;
    const attachment = /\/attachment\/(.*)?\/?$/;
    Object.entries(blocks_json_1.default).forEach((element) => {
        const currenturl = element[1].siteProperties.feedDomainURL;
        if (`${URI.protocol}//${URI.hostname}` === currenturl) {
            site.siteId = element[0];
        }
    });
    if (URI.pathname.match(/^\/autor\//) != null) {
        site.storyTitle = segmentedUrl[1];
    }
    else if (URI.pathname.match(attachment) != null) {
        const stepOne = URI.pathname.split('/attachment/')[0];
        const stepTwo = stepOne.split('/');
        site.storyTitle = stepTwo[stepTwo.length - 1];
    }
    else if ((URI.pathname.match(roxen) != null) || (URI.pathname.match(video) != null) || (URI.pathname.match(galeria) != null)) {
        site.storyTitle = segmentedUrl[segmentedUrl.length - 3];
    }
    else if (URI.pathname.match(/\/$/) !== null) {
        site.storyTitle = segmentedUrl[segmentedUrl.length - 2];
    }
    else {
        site.storyTitle = segmentedUrl[segmentedUrl.length - 1];
    }
    site.storyTitle = site.storyTitle.replace(/.html$/, '');
    if (site.siteId === '') {
        console.log('This fail =====>', url);
    }
    return site;
};
exports.geIdentiflyUrl = geIdentiflyUrl;
const simpleRowData = (lists, showCellName) => __awaiter(void 0, void 0, void 0, function* () {
    if (lists !== null && lists.length > 0) {
        const currentSimpleList = [];
        let find = false;
        let position = 0;
        lists[0].forEach((value, index) => {
            if (value === showCellName) {
                position = index;
                find = true;
            }
        });
        if (find) {
            lists.forEach((row, index) => {
                if (index !== 0) {
                    currentSimpleList.push(row[position]);
                }
            });
            return currentSimpleList;
        }
        return null;
    }
    return null;
});
exports.simpleRowData = simpleRowData;
const getSimpleLinkValues = (row, key) => {
    return {
        url: row[0],
        httpStatus: Number(row[1]),
        typeOfUrl: row[2],
        outputType: row[3],
        probableSolution: row[4],
        solution: row[5].split(','),
        status: row[6],
        position: key + 1
    };
};
exports.getSimpleLinkValues = getSimpleLinkValues;
const fetchData = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const currentData = {
        url: url,
        httpStatus: null,
        typeOfUrl: null,
        outputType: getOutputTypeFromUrl(url),
        probableSolution: null,
        solution: null,
        status: 'none'
    };
    try {
        const validateUrl = (0, exports.sanitizePathToWWWWpath)(url);
        let currentUrl = url;
        if (validateUrl !== null) {
            currentUrl = validateUrl;
            currentData.probableSolution = validateUrl;
        }
        const urlInfo = yield axios_1.default.get(currentUrl);
        if ('status' in urlInfo) {
            currentData.httpStatus = urlInfo.status;
            if (urlInfo.status < 400) {
                currentData.status = 'ok';
            }
            if (currentData.outputType === 'default') {
                const check = urlInfo.data;
                currentData.typeOfUrl = getGlobalContetType(check);
            }
            else {
                const tempUrl = url.replace('outputType=amp', '');
                const tempData = yield (0, exports.fetchData)(tempUrl);
                if (tempData !== null) {
                    currentData.typeOfUrl = tempData.typeOfUrl;
                }
            }
        }
        return currentData;
    }
    catch (error) {
        const err = error;
        if (err.response != null && err.response !== undefined) {
            currentData.httpStatus = err.response.status;
            currentData.typeOfUrl = yield rudimentaryUrlDistribution(url);
        }
        return currentData;
    }
});
exports.fetchData = fetchData;
