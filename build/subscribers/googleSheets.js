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
exports.updateAgroupOfValuesInSheet = exports.updateRowData = exports.createGoogleSheet = exports.accessToGoogleSheets = void 0;
const googleapis_1 = require("googleapis");
const genericUtils_1 = require("../utils/genericUtils");
const barUtils_1 = require("../utils/barUtils");
const googleInfo = {
    keyFile: './src/config/googleAccess.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly']
};
const accessToGoogleSheets = (sheetId, sheetName) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const currentList = [];
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth(googleInfo);
        const sheets = yield googleapis_1.google.sheets('v4');
        const request = {
            spreadsheetId: sheetId,
            ranges: [sheetName],
            includeGridData: true,
            auth
        };
        try {
            const specificSheets = yield sheets.spreadsheets.get(request);
            (_a = specificSheets.data.sheets) === null || _a === void 0 ? void 0 : _a.forEach((value) => {
                var _a;
                (_a = value.data) === null || _a === void 0 ? void 0 : _a.forEach((row) => {
                    var _a;
                    (_a = row.rowData) === null || _a === void 0 ? void 0 : _a.forEach((cell) => {
                        var _a;
                        const rowValues = [];
                        (_a = cell.values) === null || _a === void 0 ? void 0 : _a.forEach((element) => {
                            rowValues.push(String(element.formattedValue));
                        });
                        currentList.push(rowValues);
                    });
                });
            });
            return currentList;
        }
        catch (error) {
            console.error(error);
        }
    }
    catch (error) {
        console.error(error);
    }
    if ((yield currentList.length) > 0) {
        return currentList;
    }
    else {
        return null;
    }
});
exports.accessToGoogleSheets = accessToGoogleSheets;
const createGoogleSheet = (arr, sheetname, spreadsheetId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const auth = new googleapis_1.google.auth.GoogleAuth(googleInfo);
        const sheets = yield googleapis_1.google.sheets('v4');
        const tempArray = [];
        tempArray.push(['URL', 'httpStatus', 'typeOfUrl', 'outputType', 'solution', 'method', 'status']);
        for (let index = 0; index < arr.length; index++) {
            tempArray.push([
                String(arr[index].url),
                String(arr[index].httpStatus),
                String(arr[index].typeOfUrl),
                String(arr[index].outputType),
                String(arr[index].probableSolution),
                String(arr[index].solution),
                arr[index].status
            ]);
        }
        const requestForData = {
            spreadsheetId: spreadsheetId,
            range: sheetname,
            valueInputOption: 'USER_ENTERED',
            resource: {
                majorDimension: 'ROWS',
                values: tempArray
            },
            auth
        };
        yield createNewSheet(sheets, spreadsheetId, sheetname, auth);
        const result = yield sheets.spreadsheets.values.update(requestForData);
        console.log(result);
    }
    catch (error) {
        console.log(error);
    }
    return null;
});
exports.createGoogleSheet = createGoogleSheet;
const updateRowData = (spreadSheetId, sheetName, position, dataValues) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const auth = new googleapis_1.google.auth.GoogleAuth(googleInfo);
    const sheets = yield googleapis_1.google.sheets('v4');
    const requestForData = {
        spreadsheetId: spreadSheetId,
        range: `${sheetName}!A${position}:G${position}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
            majorDimension: 'ROWS',
            values: [[
                    dataValues.url,
                    dataValues.httpStatus,
                    dataValues.typeOfUrl,
                    dataValues.outputType,
                    dataValues.probableSolution,
                    (_b = dataValues.solution) === null || _b === void 0 ? void 0 : _b.join(),
                    dataValues.status
                ]]
        },
        auth
    };
    const result = yield sheets.spreadsheets.values.update(requestForData);
    return result;
});
exports.updateRowData = updateRowData;
const updateAgroupOfValuesInSheet = (sheetId, urlListToMod, textForBar) => __awaiter(void 0, void 0, void 0, function* () {
    if (urlListToMod.length > 0) {
        const progressRevision = (0, barUtils_1.checkBarConfig)(textForBar.firstText, textForBar.lastText);
        let progressCount = 1;
        progressRevision.start(urlListToMod.length, 0);
        for (const item of urlListToMod) {
            if (item.url !== null) {
                const externalLink = item;
                yield (0, exports.updateRowData)(sheetId, 'Output', item.position, externalLink);
                yield (0, genericUtils_1.delay)(1000);
            }
            progressRevision.update(progressCount);
            progressCount++;
        }
        progressRevision.stop();
        return true;
    }
    else {
        return false;
    }
});
exports.updateAgroupOfValuesInSheet = updateAgroupOfValuesInSheet;
const createNewSheet = (sheets, spreadsheetId, sheetname, auth) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield sheets.spreadsheets.batchUpdate({
            auth,
            spreadsheetId: spreadsheetId,
            requestBody: {
                requests: [{
                        addSheet: {
                            properties: { title: sheetname }
                        }
                    }]
            }
        });
        return true;
    }
    catch (error) {
        console.error('Error al crear sheet =>', error);
        return false;
    }
});
