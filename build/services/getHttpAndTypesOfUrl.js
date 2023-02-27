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
exports.checkUrlsStatusFromSheets = void 0;
const googleSheets_1 = require("../subscribers/googleSheets");
const genericUtils_1 = require("../utils/genericUtils");
const cli_progress_1 = __importDefault(require("cli-progress"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const checkUrlsStatusFromSheets = (sheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const start = new Date().getTime();
        const urlList = [];
        const rows = yield (0, genericUtils_1.simpleRowData)(yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Table'), 'URL');
        const progressRevision = new cli_progress_1.default.SingleBar({
            format: `HTTP Request Progress | ${ansi_colors_1.default.cyan('{bar}')} | {percentage}% || {value}/{total} URL's`,
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
            hideCursor: true
        });
        if (rows !== undefined && rows !== null) {
            progressRevision.start(rows.length, 0);
            let count = 1;
            for (const item of rows) {
                let routeInPage = '';
                routeInPage = item;
                const currentData = yield (0, genericUtils_1.fetchData)(routeInPage);
                const externalLink = currentData;
                urlList.push(externalLink);
                progressRevision.update(count);
                count++;
            }
            progressRevision.stop();
        }
        yield (0, googleSheets_1.createGoogleSheet)(urlList, 'Output', sheetId);
        const end = (new Date().getTime() - start) / 60000;
        console.log('\nTiempo de ejecución ===>', end, ' min.\n');
        return urlList;
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.checkUrlsStatusFromSheets = checkUrlsStatusFromSheets;
