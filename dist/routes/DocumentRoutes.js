"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const path_1 = __importDefault(require("path"));
class DocumentRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
    }
    initRoutes() {
        this.router.get("/", (req, res) => {
            const filePath = path_1.default.join(__dirname, "../views/index.html");
            res.sendFile(filePath);
        });
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new DocumentRoutes().getRouter();
