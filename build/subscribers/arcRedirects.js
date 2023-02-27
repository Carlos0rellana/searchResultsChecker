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
exports.deleteRedirect = exports.checkRedirect = exports.makeRedirect = void 0;
const axios_1 = __importDefault(require("axios"));
const access = __importStar(require("../config/tokenAccessArc.json"));
const blocks_json_1 = __importDefault(require("../config/static_data/blocks.json"));
const allSites = blocks_json_1.default;
const axiosConfig = (siteId, url, data = '', method = 'get') => {
    var _a;
    const hostName = (_a = allSites[siteId]) === null || _a === void 0 ? void 0 : _a.siteProperties.feedDomainURL;
    if (hostName !== undefined && url.includes(hostName)) {
        const currentPath = new URL(url);
        url = currentPath.pathname;
    }
    return {
        method: method,
        url: `https://api.metroworldnews.arcpublishing.com/draft/v1/redirect/${siteId}/${url}`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: access.token
        },
        data: data
    };
};
const makeRedirect = (siteId, urlToFrom, urlToGo) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hostName = (_a = allSites[siteId]) === null || _a === void 0 ? void 0 : _a.siteProperties.feedDomainURL;
    if (hostName !== undefined && urlToFrom.includes(hostName)) {
        const originPath = new URL(urlToFrom);
        urlToFrom = originPath.pathname;
    }
    if (hostName !== undefined && urlToGo.includes(hostName)) {
        const destinyPath = new URL(urlToGo);
        urlToGo = destinyPath.pathname;
    }
    let send = null;
    if (urlToGo.match(/\//) !== null) {
        send = JSON.stringify({
            redirect_to: urlToGo
        });
    }
    else {
        send = JSON.stringify({
            document_id: urlToGo
        });
    }
    const config = {
        method: 'post',
        url: `https://api.metroworldnews.arcpublishing.com/draft/v1/redirect/${siteId}/${urlToFrom}`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: access.token
        },
        data: send
    };
    return yield (0, axios_1.default)(config)
        .then(function (response) {
        const result = response.data;
        if (result.create_at !== undefined) {
            return true;
        }
        else if (result.error_code !== undefined) {
            return result.error_code;
        }
        else {
            return false;
        }
    })
        .catch(function (error) {
        console.log('Error de redirección ====>', error);
        return false;
    });
});
exports.makeRedirect = makeRedirect;
const checkRedirect = (siteId, urlToSearch) => __awaiter(void 0, void 0, void 0, function* () {
    const config = axiosConfig(siteId, urlToSearch);
    return yield (0, axios_1.default)(config)
        .then(function (response) {
        const result = response.data;
        if ((result === null || result === void 0 ? void 0 : result.redirect_to) !== undefined) {
            return result.redirect_to;
        }
        else if ((result === null || result === void 0 ? void 0 : result.document_id) !== undefined) {
            return result.document_id;
        }
        else {
            return null;
        }
    })
        .catch(function (_error) {
        // console.log(error)
        return null;
    });
});
exports.checkRedirect = checkRedirect;
const deleteRedirect = (siteId, urlToDelete) => __awaiter(void 0, void 0, void 0, function* () {
    const config = axiosConfig(siteId, urlToDelete, '', 'delete');
    return yield (0, axios_1.default)(config)
        .then(function (response) {
        const result = response.data;
        if ((result === null || result === void 0 ? void 0 : result.redirect_to) !== undefined) {
            return true;
        }
        else {
            return false;
        }
    })
        .catch(function (error) {
        console.log(error);
        return false;
    });
});
exports.deleteRedirect = deleteRedirect;
