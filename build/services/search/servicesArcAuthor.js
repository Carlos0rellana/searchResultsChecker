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
exports.checkAuthorInOutput = void 0;
const googleSheets_1 = require("../../subscribers/googleSheets");
const genericUtils_1 = require("../../utils/genericUtils");
const checkAuthorInOutput = (sheetId, filter = false) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentList = [];
        const rows = yield (0, googleSheets_1.accessToGoogleSheets)(sheetId, 'Output');
        rows === null || rows === void 0 ? void 0 : rows.forEach((row, key) => {
            const rowData = (0, genericUtils_1.getSimpleLinkValues)(row, key);
            if (rowData.typeOfUrl === 'author') {
                if (!filter) {
                    currentList.push(rowData);
                }
                if (filter && parseInt(row[1]) > 499) {
                    currentList.push(rowData);
                }
            }
        });
    }
    catch (error) {
        console.error(error);
        return null;
    }
});
exports.checkAuthorInOutput = checkAuthorInOutput;
