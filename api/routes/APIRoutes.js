"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const express_1 = require("express");
const APIController_1 = __importDefault(require("../controllers/APIController"));
(0, dotenv_1.config)();
class APIRoutes {
    constructor() {
        this.router = (0, express_1.Router)();
        this.initRoutes();
        this.apiController = new APIController_1.default();
    }
    initRoutes() {
        this.router.get("/callback", (req, res) => this.apiController.loginCallback(req, res));
        this.router.post("/create-playlist", async (req, res) => this.apiController.createPlaylist(req, res));
        this.router.post("/manual-create-playlist", async (req, res) => this.apiController.manualCreatePlaylist(req, res));
        this.router.post("/manual-submit-playlist", async (req, res) => this.apiController.manualSubmitPlaylist(req, res));
    }
    getRouter() {
        return this.router;
    }
}
exports.default = new APIRoutes().getRouter();
