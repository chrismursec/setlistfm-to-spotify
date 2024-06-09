import axios from "axios";
import dotenv from "dotenv";
import { Request, Response } from "express";
import SpotifyHelper from "../helpers/SpotifyHelper";
dotenv.config();

class APIController {
  private spotifyHelper: SpotifyHelper = new SpotifyHelper();
  constructor() {
    this.spotifyHelper = new SpotifyHelper();
  }

  public async loginCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code;
    console.log(code);

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    try {
      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        new URLSearchParams({
          code: code as string,
          redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            Authorization:
              "Basic " +
              Buffer.from(
                process.env.SPOTIFY_CLIENT_ID! +
                  ":" +
                  process.env.SPOTIFY_CLIENT_SECRET!
              ).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token: accessToken, refresh_token: refreshToken } =
        tokenResponse.data;

      const userResponse = await axios.get("https://api.spotify.com/v1/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userDetails = {
        accessToken: accessToken,
      };

      res.redirect(
        `/?userDetails=${encodeURIComponent(JSON.stringify(userDetails))}`
      );
    } catch (error: any) {
      console.error(
        "Error in login callback:",
        error.response?.data || error.message
      );
      const statusCode = error.response?.status || 500;
      res.status(statusCode).json({ error: "An unexpected error occurred" });
    }
  }

  public async createPlaylist(req: Request, res: Response): Promise<void> {
    let userAccessToken = req.body.accessToken;
    let setlistFmLink = req.body.setlistFmLink;
    let playlistName = req.body.playlistName;

    const url = setlistFmLink;

    const songLabels = await this.spotifyHelper.extractSongLabels(url);
    const artistName = await this.spotifyHelper.extractArtist(url);
    console.log(artistName);

    const accessToken = await this.spotifyHelper.getSpotifyAccessToken();
    if (!accessToken) return;

    const userId = await this.spotifyHelper.getSpotifyUserId(userAccessToken);
    console.log("User ID:", userId);

    const trackIds = [];
    for (const label of songLabels) {
      const trackId = await this.spotifyHelper.searchSpotifyTrack(
        label,
        artistName,
        accessToken
      );
      if (trackId) {
        trackIds.push(trackId);
      }
    }

    const playlistId = await this.spotifyHelper.createSpotifyPlaylist(
      userId,
      playlistName,
      userAccessToken
    );
    if (!playlistId) return;

    await this.spotifyHelper.addTracksToSpotifyPlaylist(
      playlistId,
      trackIds,
      userAccessToken
    );
    res.status(200).json({ success: "Playlist created successfully" });
  }
}

export default APIController;
