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
exports.searchInGoogleServiceApi = void 0;
const axios_1 = __importDefault(require("axios"));
const blocks_json_1 = __importDefault(require("../config/static_data/blocks.json"));
const allSites = blocks_json_1.default;
const compareRatio = (ratio, toSearch, toCompare) => {
    const wordList = toSearch.split('-');
    let count = 0;
    for (const word of wordList) {
        if (toCompare.includes(word)) {
            count++;
        }
    }
    console.log(`${toSearch}<====>${toCompare}`);
    const finalRatio = count / wordList.length;
    if (finalRatio > ratio) {
        return finalRatio;
    }
    return null;
};
const searchInGoogleServiceApi = (websiteId, toSearch, priority = null) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const idSearch = ((_a = allSites[websiteId].siteProperties) === null || _a === void 0 ? void 0 : _a.searchId) !== undefined ? allSites[websiteId].siteProperties.searchId : null;
    console.log('\nse entra a API de Google\n');
    if (idSearch === null) {
        console.log('Sitio no tiene configurado CX en blocks.json');
        return null;
    }
    const config = {
        method: 'get',
        timeout: 1500,
        url: `https://www.googleapis.com/customsearch/v1?key=AIzaSyDU_qbCbOQfA2CYtCD_mD8DNXS60Op5A8Q&cx=${idSearch}&q=${toSearch}`
    };
    return yield (0, axios_1.default)(config)
        .then(function (response) {
        var _a, _b, _c;
        const dataResults = response.data.searchInformation.totalResults;
        const dataSearch = response.data.items;
        const ratioUrlList = [];
        console.log('DataResult=====>\n', dataResults);
        if (dataResults > 0 && dataSearch !== undefined) {
            for (const searchItem of dataSearch) {
                if (priority === null) {
                    if (((_a = searchItem.link) === null || _a === void 0 ? void 0 : _a.match(toSearch)) !== null) {
                        const value = new URL(searchItem.link);
                        return value.pathname;
                    }
                }
                else {
                    const comparedStringType = priority === 'gallery' ? '/galeria' : '/video';
                    if (((_b = searchItem.link) === null || _b === void 0 ? void 0 : _b.match(toSearch)) !== null && ((_c = searchItem.link) === null || _c === void 0 ? void 0 : _c.match(comparedStringType)) === null) {
                        const value = new URL(searchItem.link);
                        return value.pathname;
                    }
                }
                const checkRatio = compareRatio(0.6, toSearch, searchItem);
                console.log('=========>', checkRatio);
                if (checkRatio !== null) {
                    ratioUrlList.push([searchItem, checkRatio]);
                }
            }
            console.log('========================');
            console.log(ratioUrlList);
            console.log('========================');
            return null;
        }
        console.log();
        return null;
    })
        .catch(function (error) {
        var _a;
        if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.statusText) !== undefined) {
            console.error('Error de Search Google ====>', error.response.statusText);
            return error.response.statusText;
        }
        return null;
    });
});
exports.searchInGoogleServiceApi = searchInGoogleServiceApi;
