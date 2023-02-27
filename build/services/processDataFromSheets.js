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
exports.deleteRedirectsFromSheets = exports.proccessTagsFromSheets = exports.proccessRedirectsFromSheets = void 0;
const googleSheets_1 = require("../subscribers/googleSheets");
const genericUtils_1 = require("../utils/genericUtils");
// import sitesData from '../config/static_data/blocks.json'
const cli_progress_1 = __importDefault(require("cli-progress"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const arcRedirects_1 = require("../subscribers/arcRedirects");
const arcTags_1 = require("../subscribers/arcTags");
// const allSites: SitesList = sitesData as SitesList
const proccessRedirectsFromSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const urlList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        const rowsOfRedirect = [];
        let lastRedirect = false;
        const progressRevision = new cli_progress_1.default.SingleBar({
            format: `Redirect Progress | ${ansi_colors_1.default.green('{bar}')} | {percentage}% || {value}/{total} Redirects`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        if (rows !== undefined && rows !== null) {
            let progressCount = 0;
            let key = 0;
            for (const urlValidate of rows) {
                const rowData = (0, genericUtils_1.getSimpleLinkValues)(urlValidate, key);
                if (rowData.status === 'process' &&
                    ((_a = rowData.solution) === null || _a === void 0 ? void 0 : _a.includes('redirect')) !== false &&
                    rowData.httpStatus !== null &&
                    rowData.httpStatus >= 400 &&
                    rowData.httpStatus < 499) {
                    rowsOfRedirect.push(rowData);
                }
                key++;
            }
            progressRevision.start(rowsOfRedirect.length, 0);
            for (const item of rowsOfRedirect) {
                if (item.url !== null &&
                    item.url !== 'undefined' &&
                    item.url.length > 5 &&
                    item.solution !== null &&
                    item.probableSolution !== null) {
                    const URI = new URL(item.url);
                    const earlyUrl = (0, genericUtils_1.geIdentiflyUrl)(item.url);
                    const externalLink = item;
                    const redirectTo = item.probableSolution;
                    const originPath = URI.pathname;
                    const firstRedirect = yield (0, arcRedirects_1.makeRedirect)(earlyUrl.siteId, originPath, redirectTo);
                    if (originPath.match(/\/$/) !== null) {
                        lastRedirect = yield (0, arcRedirects_1.makeRedirect)(earlyUrl.siteId, originPath.replace(/\/$/, ''), redirectTo);
                        externalLink.status = 'waiting-ok';
                    }
                    else {
                        lastRedirect = yield (0, arcRedirects_1.makeRedirect)(earlyUrl.siteId, `${originPath}/`, redirectTo);
                        externalLink.status = 'waiting-ok';
                    }
                    if ((yield firstRedirect) !== false || (yield lastRedirect) !== false) {
                        urlList.push(externalLink);
                        console.log('testing');
                        yield (0, googleSheets_1.updateRowData)(sheetId, 'Output', item.position, externalLink);
                    }
                }
                progressCount++;
                progressRevision.update(progressCount);
            }
            progressRevision.stop();
        }
        return urlList;
    }
    catch (_error) {
        // console.error(error)
        return null;
    }
});
exports.proccessRedirectsFromSheets = proccessRedirectsFromSheets;
const proccessTagsFromSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const urlList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        const rowsOfRedirect = [];
        const progressRevision = new cli_progress_1.default.SingleBar({
            format: `Tags Progress | ${ansi_colors_1.default.green('{bar}')} | {percentage}% || {value}/{total} Tags`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        if (rows !== undefined && rows !== null) {
            let progressCount = 1;
            let key = 0;
            for (const urlValidate of rows) {
                const rowData = (0, genericUtils_1.getSimpleLinkValues)(urlValidate, key);
                if (rowData.status === 'process' &&
                    rowData.typeOfUrl === 'tag' &&
                    ((_b = rowData.solution) === null || _b === void 0 ? void 0 : _b.includes('create')) !== false &&
                    rowData.httpStatus !== null &&
                    rowData.httpStatus >= 400 &&
                    rowData.httpStatus < 499) {
                    rowsOfRedirect.push(rowData);
                }
                key++;
            }
            progressRevision.start(rowsOfRedirect.length, 0);
            for (const item of rowsOfRedirect) {
                if (item.url !== null &&
                    item.url !== 'undefined' &&
                    item.url.length > 5 &&
                    item.solution !== null &&
                    item.probableSolution !== null) {
                    const externalLink = item;
                    if ((yield (0, arcTags_1.makeAtagByslug)(item.probableSolution)) === true) {
                        externalLink.status = 'waiting-ok';
                        yield (0, googleSheets_1.updateRowData)(sheetId, 'Output', item.position, externalLink);
                    }
                }
                progressCount++;
                progressRevision.update(progressCount);
            }
            progressRevision.stop();
        }
        return urlList;
    }
    catch (_error) {
        // console.error(error)
        return null;
    }
});
exports.proccessTagsFromSheets = proccessTagsFromSheets;
const deleteRedirectsFromSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const urlList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        const rowsOfRedirect = [];
        let firstRedirect = false;
        let lastRedirect = false;
        const progressRevision = new cli_progress_1.default.SingleBar({
            format: `Clear Redirect Progress | ${ansi_colors_1.default.red('{bar}')} | {percentage}% || {value}/{total} Redirects`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        if (rows !== undefined && rows !== null) {
            let progressCount = 1;
            let key = 0;
            for (const urlValidate of rows) {
                const rowData = (0, genericUtils_1.getSimpleLinkValues)(urlValidate, key);
                if (rowData.status === 'none' &&
                    ((_c = rowData.solution) === null || _c === void 0 ? void 0 : _c.includes('clear')) !== false &&
                    rowData.httpStatus !== null &&
                    rowData.httpStatus >= 400 &&
                    rowData.httpStatus < 499) {
                    rowsOfRedirect.push(rowData);
                }
                key++;
            }
            progressRevision.start(rowsOfRedirect.length, 0);
            for (const item of rowsOfRedirect) {
                if (item.url !== null && item.solution !== null && item.probableSolution !== null) {
                    const URI = new URL(item.url);
                    const earlyUrl = (0, genericUtils_1.geIdentiflyUrl)(item.url);
                    const externalLink = item;
                    const originPath = URI.pathname;
                    firstRedirect = yield (0, arcRedirects_1.deleteRedirect)(earlyUrl.siteId, originPath);
                    if (originPath.match(/\/$/) != null) {
                        lastRedirect = yield (0, arcRedirects_1.deleteRedirect)(earlyUrl.siteId, originPath.replace(/\/$/, ''));
                    }
                    else {
                        lastRedirect = yield (0, arcRedirects_1.deleteRedirect)(earlyUrl.siteId, `${originPath}/`);
                    }
                    if ((yield firstRedirect) && (yield lastRedirect)) {
                        externalLink.status = 'process';
                        externalLink.solution = ['redirect'];
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
exports.deleteRedirectsFromSheets = deleteRedirectsFromSheets;
