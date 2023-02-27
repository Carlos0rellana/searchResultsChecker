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
exports.checkMetroDB = void 0;
const axios_1 = __importDefault(require("axios"));
const checkMetroDB = (websiteId, toSearch) => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        method: 'get',
        timeout: 10000,
        url: `https://pdfserv2.readmetro.com/getUrlArc.php?website=${websiteId}&url=${toSearch}`
    };
    return yield (0, axios_1.default)(config)
        .then(function (response) {
        var _a, _b, _c;
        const data = response.data;
        let currentUrl = null;
        if ((data === null || data === void 0 ? void 0 : data.total) > 0 && ((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.info_arc) !== undefined) {
            const listRedirect = (_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.info_arc;
            if (listRedirect.length > 1) {
                listRedirect.forEach((foundRedirect) => {
                    var _a;
                    if (foundRedirect.id_arc !== undefined &&
                        foundRedirect.id_arc !== null &&
                        (foundRedirect === null || foundRedirect === void 0 ? void 0 : foundRedirect.url_arc) !== undefined &&
                        ((_a = foundRedirect === null || foundRedirect === void 0 ? void 0 : foundRedirect.url_arc) === null || _a === void 0 ? void 0 : _a.match(`${toSearch}-[0-9][0-9]?`)) == null) {
                        currentUrl = foundRedirect.url_arc;
                    }
                });
                if (currentUrl === null) {
                    listRedirect.forEach((foundRedirect) => {
                        var _a;
                        for (let index = 0; index < 20; index++) {
                            if (foundRedirect.id_arc !== undefined && foundRedirect.id_arc !== null &&
                                (foundRedirect === null || foundRedirect === void 0 ? void 0 : foundRedirect.url_arc) !== undefined &&
                                ((_a = foundRedirect === null || foundRedirect === void 0 ? void 0 : foundRedirect.url_arc) === null || _a === void 0 ? void 0 : _a.match(`${toSearch}-${index}`)) != null) {
                                currentUrl = foundRedirect.url_arc;
                            }
                        }
                    });
                }
            }
            else {
                if (((_c = listRedirect[0]) === null || _c === void 0 ? void 0 : _c.url_arc) !== undefined) {
                    currentUrl = listRedirect[0].url_arc;
                }
            }
            return currentUrl;
        }
        else {
            return null;
        }
    })
        .catch(function (_error) {
        // console.error(error)
        return null;
    });
});
exports.checkMetroDB = checkMetroDB;
