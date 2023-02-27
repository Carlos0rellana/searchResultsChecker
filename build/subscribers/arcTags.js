"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.makeAtagByslug = exports.getTagBySlug = void 0;
const axios_1 = __importDefault(require("axios"));
const access = __importStar(require("../config/tokenAccessArc.json"));
const getTagBySlug = (tagId) => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        method: 'get',
        url: `https://api.metroworldnews.arcpublishing.com/tags/v2/slugs?slugs=${tagId}`,
        headers: {
            Authorization: access.token
        }
    };
    return yield (0, axios_1.default)(config)
        .then(function (response) {
        const result = response.data;
        if ((result === null || result === void 0 ? void 0 : result.Payload) !== undefined && (result === null || result === void 0 ? void 0 : result.Payload.length) > 0 && (result === null || result === void 0 ? void 0 : result.Payload[0]) !== null) {
            return true;
        }
        return false;
    })
        .catch(function (error) {
        console.log(error);
        return false;
    });
});
exports.getTagBySlug = getTagBySlug;
const makeAtagByslug = (slugTag) => __awaiter(void 0, void 0, void 0, function* () {
    const data = JSON.stringify([
        {
            slug: slugTag
        }
    ]);
    const config = {
        method: 'post',
        url: 'https://api.metroworldnews.arcpublishing.com/tags/add/',
        headers: {
            Authorization: access.token,
            'Content-Type': 'application/json'
        },
        data: data
    };
    return yield (0, axios_1.default)(config)
        .then(function (_response) {
        // console.log(JSON.stringify(response.data))
        return true;
    })
        .catch(function (_error) {
        // console.log(error)
        return false;
    });
});
exports.makeAtagByslug = makeAtagByslug;
