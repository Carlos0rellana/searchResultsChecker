"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBarConfig = exports.searchBarConfig = exports.settingBar = void 0;
const cli_progress_1 = __importDefault(require("cli-progress"));
const ansi_colors_1 = __importDefault(require("ansi-colors"));
const settingBar = (barConfig) => {
    return new cli_progress_1.default.SingleBar({
        format: `${barConfig.firstText} | ${barConfig.colorConfig('{bar}')} | {percentage}% || {value}/{total} ${barConfig.lastText}`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });
};
exports.settingBar = settingBar;
const searchBarConfig = (searchText) => {
    const barConfig = {
        colorConfig: ansi_colors_1.default.bgYellow,
        firstText: searchText,
        lastText: 'URLs'
    };
    return (0, exports.settingBar)(barConfig);
};
exports.searchBarConfig = searchBarConfig;
const checkBarConfig = (checkText, checkStatus) => {
    const barConfig = {
        colorConfig: ansi_colors_1.default.bgGreen,
        firstText: checkText,
        lastText: checkStatus
    };
    return (0, exports.settingBar)(barConfig);
};
exports.checkBarConfig = checkBarConfig;
