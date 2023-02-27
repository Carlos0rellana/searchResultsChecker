"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const getSitesPropierties_1 = require("../services/getSitesPropierties");
const siteLists = express_1.default.Router();
siteLists.get('/', (_req, res) => {
    res.send((0, getSitesPropierties_1.getSiteList)());
});
exports.default = siteLists;
