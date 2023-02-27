"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testing = void 0;
const express_1 = __importDefault(require("express"));
const grammarly_1 = require("../subscribers/grammarly");
exports.testing = express_1.default.Router();
exports.testing.get('/checkspells/:phrase', (req, res) => {
    const values = (0, grammarly_1.getAsyncWebGrammarly)(decodeURI(req.params.phrase));
    res.send(values);
});
