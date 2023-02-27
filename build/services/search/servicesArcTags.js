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
exports.searchAndUpdateTagInSheets = exports.checkTagsFromSheets = exports.searchTag = void 0;
const arcTags_1 = require("../../subscribers/arcTags");
const googleSheets_1 = require("../../subscribers/googleSheets");
const barUtils_1 = require("../../utils/barUtils");
const genericUtils_1 = require("../../utils/genericUtils");
const searchTag = (tagItem, forced) => __awaiter(void 0, void 0, void 0, function* () {
    if (tagItem.url !== null) {
        let tagSlug;
        if (tagItem.url.match(/\/tags?\//) !== null) {
            tagSlug = tagItem.url.split(/\/tags?\//)[1];
        }
        else {
            tagSlug = new URL(tagItem.url).pathname.split('/')[1];
        }
        tagSlug = tagSlug.match(/\//) !== null ? tagSlug.split('/')[0] : tagSlug;
        if (yield (0, arcTags_1.getTagBySlug)(tagSlug)) {
            tagItem.solution = ['redirect'];
            tagItem.probableSolution = `/tag/${tagSlug}`;
            tagItem.typeOfUrl = 'tag';
            tagItem.status = 'process';
            return tagItem;
        }
        else if (forced === true) {
            tagItem.solution = ['create'];
            tagItem.probableSolution = tagSlug;
            tagItem.typeOfUrl = 'tag';
            tagItem.status = 'process';
            return tagItem;
        }
    }
    return null;
});
exports.searchTag = searchTag;
const searchTagsInArcBucle = (itemList) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nStart to search in Arc:');
    const findTags = [];
    if (itemList.length > 0) {
        let key = 0;
        const progressRevisionOfSearch = (0, barUtils_1.searchBarConfig)('Search Tags in Arc');
        progressRevisionOfSearch.start(itemList.length, 0);
        for (const tagItem of itemList) {
            const temp = yield (0, exports.searchTag)(tagItem, false);
            if (temp !== null) {
                findTags.push(temp);
            }
            key++;
            progressRevisionOfSearch.update(key);
        }
        progressRevisionOfSearch.stop();
    }
    return findTags;
});
const checkTagsFromSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const urlList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        if (rows !== null) {
            const options = {
                httpStatus: 400,
                method: null,
                type: 'tag',
                status: 'waiting-ok'
            };
            const clearTagsList = (0, genericUtils_1.genericFilter)(rows, options);
            if (clearTagsList.length > 0) {
                for (const tagLink of clearTagsList) {
                    if (tagLink.url !== null) {
                        const checkValues = yield (0, genericUtils_1.fetchData)(tagLink.url);
                        const currentTagValues = tagLink;
                        if (checkValues.httpStatus !== null &&
                            checkValues.httpStatus >= 400 &&
                            checkValues.httpStatus < 500) {
                            currentTagValues.status = 'manual';
                        }
                        else {
                            currentTagValues.status = 'ok';
                        }
                        yield (0, googleSheets_1.updateRowData)(sheetId, 'Output', tagLink.position, currentTagValues);
                        urlList.push(currentTagValues);
                    }
                }
            }
            return urlList;
        }
        return null;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.checkTagsFromSheets = checkTagsFromSheets;
const searchAndUpdateTagInSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        if ((yield rows) !== undefined && (yield rows) !== null) {
            const options = {
                httpStatus: 400,
                method: null,
                type: 'tag',
                status: 'none'
            };
            const rowsOfTags = (0, genericUtils_1.genericFilter)(rows, options);
            const rowsToSaveInSheet = yield searchTagsInArcBucle(rowsOfTags);
            if ((yield rowsToSaveInSheet.length) > 0) {
                const barText = {
                    firstText: 'Update Tags in Sheets',
                    lastText: 'updates.'
                };
                yield (0, googleSheets_1.updateAgroupOfValuesInSheet)(sheetId, rowsToSaveInSheet, barText);
                return rowsToSaveInSheet;
            }
            else {
                console.log('No se modificaron celdas.');
            }
        }
        return null;
    }
    catch (_error) {
        //console.error(error)
        return null;
    }
});
exports.searchAndUpdateTagInSheets = searchAndUpdateTagInSheets;
