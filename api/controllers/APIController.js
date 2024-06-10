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
    }
    async loginCallback(req, res) {
        var _a, _b;
        const code = req.query.code;
        if (!code) {
            res.status(400).json({ error: "Missing authorization code" });
            return;
        }
        try {
            const tokenResponse = await axios_1.default.post("https://accounts.spotify.com/api/token", new URLSearchParams({
                code,
                redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
                grant_type: "authorization_code",
            }), {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env
                        .SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            });
            const { access_token: accessToken } = tokenResponse.data;
            const userDetails = { accessToken };
            res.redirect(`/?userDetails=${encodeURIComponent(JSON.stringify(userDetails))}`);
        }
        catch (error) {
            console.error("Error in login callback:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            res
                .status(((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) || 500)
                .json({ error: "An unexpected error occurred" });
        }
    }
    async processTracks(setlistFmLink, userAccessToken) {
        const url = setlistFmLink;
        const songLabels = await this.spotifyHelper.extractSongLabels(url);
        const artistName = await this.spotifyHelper.extractArtist(url);
        const accessToken = await this.spotifyHelper.getSpotifyAccessToken();
        if (!accessToken)
            throw new Error("Failed to get Spotify access token");
        const trackIds = await Promise.all(songLabels.map(async (label) => {
            const trackId = await this.spotifyHelper.searchSpotifyTrack(label, artistName, accessToken);
            return trackId || "";
        }));
        return { trackIds: trackIds.filter((id) => id !== ""), artistName };
    }
    async createPlaylistOnSpotify(userAccessToken, playlistName, trackIds) {
        const userId = await this.spotifyHelper.getSpotifyUserId(userAccessToken);
        const playlistId = await this.spotifyHelper.createSpotifyPlaylist(userId, playlistName, userAccessToken);
        if (!playlistId)
            return null;
        await this.spotifyHelper.addTracksToSpotifyPlaylist(playlistId, trackIds, userAccessToken);
        return playlistId;
    }
    async manualCreatePlaylist(req, res) {
        try {
            const { accessToken, setlistFmLink, playlistName } = req.body;
            const { trackIds, artistName } = await this.processTracks(setlistFmLink, accessToken);
            const trackObjects = await Promise.all(trackIds.map((trackId) => this.spotifyHelper.getTrack(trackId, accessToken)));
            let html = trackObjects
                .map((trackObject) => `
        <div class="track" data-trackid="${trackObject.id}">
          <div class="track-image"><img src="${trackObject.album.images[0].url}" alt="${trackObject.name}"></div>
          <div class="track-details">
            <div class="track-info track-name">${trackObject.name}</div>
            <div class="track-info track-album">${trackObject.album.name}</div>
          </div>
          <input type="checkbox" name="track" value="${trackObject.id}" class="track-checkbox">
        </div>`)
                .join("");
            html += `<button class="create-btn" id="manual-submit" onclick="SpotifyApp.manualCreatePlaylistSubmit()">Create Playlist</button>`;
            res.status(200).send(html);
        }
        catch (error) {
            console.error("Error in manualCreatePlaylist:", error.message);
            res.status(500).json({ error: "An unexpected error occurred" });
        }
    }
    async manualSubmitPlaylist(req, res) {
        try {
            const { trackIds, accessToken, playlistName } = req.body;
            const playlistId = await this.createPlaylistOnSpotify(accessToken, playlistName, trackIds);
            if (!playlistId)
                throw new Error("Failed to create playlist");
            res.status(200).json({ success: "Playlist created successfully" });
        }
        catch (error) {
            console.error("Error in manualSubmitPlaylist:", error.message);
            res.status(500).json({ error: "An unexpected error occurred" });
        }
    }
    async createPlaylist(req, res) {
        try {
            const { accessToken, setlistFmLink, playlistName } = req.body;
            const { trackIds } = await this.processTracks(setlistFmLink, accessToken);
            const playlistId = await this.createPlaylistOnSpotify(accessToken, playlistName, trackIds);
            if (!playlistId)
                throw new Error("Failed to create playlist");
            res.status(200).json({ success: "Playlist created successfully" });
        }
        catch (error) {
            console.error("Error in createPlaylist:", error.message);
            res.status(500).json({ error: "An unexpected error occurred" });
        }
    }
}
exports.default = APIController;
