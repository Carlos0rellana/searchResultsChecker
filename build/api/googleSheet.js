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
exports.checkStories = exports.checkAuthors = exports.showGoogleSheets = void 0;
const express_1 = __importDefault(require("express"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const getHttpAndTypesOfUrl_1 = require("../services/getHttpAndTypesOfUrl");
const servicesArcAuthor_1 = require("../services/search/servicesArcAuthor");
const processDataFromSheets_1 = require("../services/processDataFromSheets");
const servicesArcRedirects_1 = require("../services/search/servicesArcRedirects");
const servicesArcTags_1 = require("../services/search/servicesArcTags");
const servicesCompleteSearchUrls_1 = require("../services/search/servicesCompleteSearchUrls");
const servicesGoogleSearch_1 = require("../services/search/servicesGoogleSearch");
const servicesMetroSearch_1 = require("../services/search/servicesMetroSearch");
const servicesArcCirculate_1 = require("../services/search/servicesArcCirculate");
const servicesArcSitemaps_1 = require("../services/search/servicesArcSitemaps");
exports.showGoogleSheets = express_1.default.Router();
exports.checkAuthors = express_1.default.Router();
exports.checkStories = express_1.default.Router();
const searchUrl = '/:documentID/search/';
// sección de busquedas
exports.checkStories.get(`${searchUrl}metro`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesMetroSearch_1.searchAndUpdateMetroInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get(`${searchUrl}google`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesGoogleSearch_1.searchAndUpdateGoogleInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get(`${searchUrl}sitemaps`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcSitemaps_1.searchAndUpdateSitemapsInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get(`${searchUrl}redirects`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcRedirects_1.searchAndUpdateRedirectsInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get(`${searchUrl}tags`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcTags_1.searchAndUpdateTagInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get(`${searchUrl}circulate`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcCirculate_1.searchAndUpdateCirculateInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get(`${searchUrl}all`, (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesCompleteSearchUrls_1.searchAndUpdatePosibilitiesInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkAuthors.get('/:documentID/check/authors', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcAuthor_1.checkAuthorInOutput)(req.params.documentID, true);
    res.send(values);
})));
exports.checkStories.get('/:documentID/check/stories', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesGoogleSearch_1.check404inGoogle)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get('/:documentID/check/redirects', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcRedirects_1.checkRedirectsFromSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get('/:documentID/check/tags', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcTags_1.checkTagsFromSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get('/:documentID/process/redirects', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, processDataFromSheets_1.proccessRedirectsFromSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get('/:documentID/process/redirects/circulate', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, servicesArcRedirects_1.searchAndUpdateExternalRedirectsInSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get('/:documentID/process/tags', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, processDataFromSheets_1.proccessTagsFromSheets)(req.params.documentID);
    res.send(values);
})));
exports.checkStories.get('/:documentID/delete/redirects', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, processDataFromSheets_1.deleteRedirectsFromSheets)(req.params.documentID);
    res.send(values);
})));
exports.showGoogleSheets.get('/:documentID', (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const values = yield (0, getHttpAndTypesOfUrl_1.checkUrlsStatusFromSheets)(req.params.documentID);
    res.send(values);
})));
