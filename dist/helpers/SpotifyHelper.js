"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class SpotifyHelper {
    constructor() {
        this.clientId = process.env.SPOTIFY_CLIENT_ID;
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    }
    async fetchHtml(url) {
        try {
            const response = await axios_1.default.get(url);
            return response.data;
        }
        catch (error) {
            console.error(`Could not fetch the page: ${error}`);
            return null;
        }
    }
    async extractArtist(url) {
        const html = await this.fetchHtml(url);
        if (html) {
            const $ = cheerio_1.default.load(html);
            const artist = $('meta[property="qc:artist"]').attr("content");
            return artist;
        }
        return null;
    }
    async extractSongLabels(url) {
        const html = await this.fetchHtml(url);
        if (html) {
            const $ = cheerio_1.default.load(html);
            const songLabels = [];
            $(".songLabel").each((index, element) => {
                const title = $(element).text();
                if (title) {
                    songLabels.push(title);
                }
            });
            return songLabels;
        }
        return [];
    }
    async getSpotifyAccessToken() {
        const authOptions = {
            method: "post",
            url: "https://accounts.spotify.com/api/token",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " +
                    Buffer.from(this.clientId + ":" + this.clientSecret).toString("base64"),
            },
            data: "grant_type=client_credentials",
        };
        try {
            const response = await (0, axios_1.default)(authOptions);
            return response.data.access_token;
        }
        catch (error) {
            console.error("Error fetching Spotify access token:", error);
            return null;
        }
    }
    async searchSpotifyTrack(trackName, artist, accessToken) {
        const searchOptions = {
            method: "get",
            url: "https://api.spotify.com/v1/search",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: {
                q: `${trackName} ${artist}`,
                type: "track",
                limit: 1,
            },
        };
        try {
            const response = await (0, axios_1.default)(searchOptions);
            const tracks = response.data.tracks.items;
            return tracks.length > 0 ? tracks[0].id : null;
        }
        catch (error) {
            console.error("Error searching for track on Spotify:", error);
            return null;
        }
    }
    async createSpotifyPlaylist(userId, playlistName, userAccessToken) {
        const createOptions = {
            method: "post",
            url: `https://api.spotify.com/v1/users/${userId}/playlists`,
            headers: {
                Authorization: `Bearer ${userAccessToken}`,
                "Content-Type": "application/json",
            },
            data: {
                name: playlistName,
                public: true,
            },
        };
        try {
            const response = await (0, axios_1.default)(createOptions);
            return response.data.id;
        }
        catch (error) {
            console.error("Error creating Spotify playlist:", error);
            return null;
        }
    }
    async addTracksToSpotifyPlaylist(playlistId, trackIds, accessToken) {
        const addOptions = {
            method: "post",
            url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            data: {
                uris: trackIds.map((id) => `spotify:track:${id}`),
            },
        };
        try {
            await (0, axios_1.default)(addOptions);
            console.log("Tracks added to playlist successfully");
        }
        catch (error) {
            console.error("Error adding tracks to Spotify playlist:", error);
        }
    }
    async getSpotifyUserId(accessToken) {
        const userProfileOptions = {
            method: "get",
            url: "https://api.spotify.com/v1/me",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };
        try {
            const response = await (0, axios_1.default)(userProfileOptions);
            return response.data.id;
        }
        catch (error) {
            console.error("Error fetching Spotify user ID:", error.response.data);
            return null;
        }
    }
}
exports.default = SpotifyHelper;
