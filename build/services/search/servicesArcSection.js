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
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchSection = void 0;
const arcHierarchy_1 = require("../../subscribers/arcHierarchy");
const genericUtils_1 = require("../../utils/genericUtils");
const searchSection = (sectionItem) => __awaiter(void 0, void 0, void 0, function* () {
    if (sectionItem.url !== null) {
        let sectionId = null;
        const siteId = (0, genericUtils_1.geIdentiflyUrl)(sectionItem.url).siteId;
        if (sectionItem.url.match(/\/categor(y|ia)\//) !== null) {
            sectionId = `/${sectionItem.url.split(/\/categor(y|ia)\//)[1]}`;
        }
        if (sectionId !== null && (yield (0, arcHierarchy_1.getCategoryById)(sectionId, siteId))) {
            sectionItem.solution = ['redirect'];
            sectionItem.probableSolution = sectionId;
            sectionItem.typeOfUrl = 'section';
            sectionItem.status = 'process';
            return sectionItem;
        }
    }
    return null;
});
exports.searchSection = searchSection;
