"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const siteProperties_1 = __importDefault(require("./api/siteProperties"));
const testing_1 = require("./api/testing");
const googleSheet_1 = require("./api/googleSheet");
const searchByUrl_1 = require("./api/searchByUrl");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const PORT = 3333;
app.listen(PORT, () => {
    console.log(`app running on port => ${PORT}`);
});
app.use('/api/sites', siteProperties_1.default);
app.use('/test/', testing_1.testing);
app.use('/api/sheets/', googleSheet_1.checkAuthors, googleSheet_1.showGoogleSheets, googleSheet_1.checkStories);
app.use('/api/url/', searchByUrl_1.searchPosibilitiesURL);
