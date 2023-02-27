"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSiteList = void 0;
const blocks_json_1 = __importDefault(require("../config/static_data/blocks.json"));
const allSites = blocks_json_1.default;
const getSiteList = () => allSites;
exports.getSiteList = getSiteList;
