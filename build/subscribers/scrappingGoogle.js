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
exports.getAsyncWebSearch = void 0;
const playwright_1 = __importDefault(require("playwright"));
const getAsyncWebSearch = (siteUrl, toSearch, priority = null) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('se entra a la busqueda');
    const launchOptions = {
        proxy: {
            server: '165.225.76.168:10605'
        }
    };
    try {
        let comparedStringType = '/galeria';
        const browser = yield playwright_1.default.chromium.launch(launchOptions);
        const page = yield browser.newPage();
        const type = priority;
        if (type === 'gallery') {
            comparedStringType = '/video';
        }
        yield page.goto(`https://www.google.com/search?q=site: ${siteUrl}+${toSearch}`);
        yield page.waitForTimeout(10000);
        const results = yield page.$('#search');
        yield page.screenshot({ path: 'my_screenshot.png' });
        const hrefLists = yield (results === null || results === void 0 ? void 0 : results.$$eval('a', as => as.map(a => a.href)));
        if (hrefLists !== undefined && hrefLists !== null) {
            for (const element of hrefLists) {
                if ((!element.includes(`site: ${siteUrl}`) &&
                    !element.includes(`site:${siteUrl}`)) &&
                    element.includes(toSearch) &&
                    element.includes(siteUrl)) {
                    if (priority !== null && element.includes(comparedStringType)) {
                        return element;
                    }
                    if (priority === null && !element.includes('/galeria') && !element.includes('/galeria')) {
                        return element;
                    }
                }
            }
            return null;
        }
        yield browser.close();
    }
    catch (error) {
        console.error(error);
    }
    return null;
});
exports.getAsyncWebSearch = getAsyncWebSearch;
