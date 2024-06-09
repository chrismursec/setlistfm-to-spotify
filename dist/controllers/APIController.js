"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const SpotifyHelper_1 = __importDefault(require("../helpers/SpotifyHelper"));
dotenv_1.default.config();
class APIController {
    constructor() {
        this.spotifyHelper = new SpotifyHelper_1.default();
        this.spotifyHelper = new SpotifyHelper_1.default();
    }
    async loginCallback(req, res) {
        var _a, _b;
        const code = req.query.code;
        console.log(code);
        if (!code) {
            res.status(400).json({ error: "Missing authorization code" });
            return;
        }
        try {
            const tokenResponse = await axios_1.default.post("https://accounts.spotify.com/api/token", new URLSearchParams({
                code: code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                grant_type: "authorization_code",
            }), {
                headers: {
                    Authorization: "Basic " +
                        Buffer.from(process.env.SPOTIFY_CLIENT_ID +
                            ":" +
                            process.env.SPOTIFY_CLIENT_SECRET).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const { access_token: accessToken, refresh_token: refreshToken } = tokenResponse.data;
            const userResponse = await axios_1.default.get("https://api.spotify.com/v1/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            const userDetails = {
                accessToken: accessToken,
            };
            res.redirect(`/?userDetails=${encodeURIComponent(JSON.stringify(userDetails))}`);
        }
        catch (error) {
            console.error("Error in login callback:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            const statusCode = ((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500;
            res.status(statusCode).json({ error: "An unexpected error occurred" });
        }
    }
    async createPlaylist(req, res) {
        let userAccessToken = req.body.accessToken;
        let setlistFmLink = req.body.setlistFmLink;
        let playlistName = req.body.playlistName;
        const url = setlistFmLink;
        const songLabels = await this.spotifyHelper.extractSongLabels(url);
        const artistName = await this.spotifyHelper.extractArtist(url);
        console.log(artistName);
        const accessToken = await this.spotifyHelper.getSpotifyAccessToken();
        if (!accessToken)
            return;
        const userId = await this.spotifyHelper.getSpotifyUserId(userAccessToken);
        console.log("User ID:", userId);
        const trackIds = [];
        for (const label of songLabels) {
            const trackId = await this.spotifyHelper.searchSpotifyTrack(label, artistName, accessToken);
            if (trackId) {
                trackIds.push(trackId);
            }
        }
        const playlistId = await this.spotifyHelper.createSpotifyPlaylist(userId, playlistName, userAccessToken);
        if (!playlistId)
            return;
        await this.spotifyHelper.addTracksToSpotifyPlaylist(playlistId, trackIds, userAccessToken);
        res.status(200).json({ success: "Playlist created successfully" });
    }
}
exports.default = APIController;
