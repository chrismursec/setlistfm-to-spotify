import dotenv from "dotenv";
import { Request, Response } from "express";
import {
  addTracksToSpotifyPlaylist,
  createSpotifyPlaylist,
  extractSongLabels,
  getSpotifyAccessToken,
  getSpotifyUserId,
  searchSpotifyTrack,
} from "../routes/helpers/spotify-helpers";
dotenv.config();

class APIController {
  constructor() {}

  public async createPlaylist(req: Request, res: Response): Promise<void> {
    let userAccessToken = req.body.accessToken;
    let setlistFmLink = req.body.setlistFmLink;
    let playlistName = req.body.playlistName;
    let artistName = req.body.artistName;

    const url = setlistFmLink;

    //Step 1: Extract song labels from setlist.fm
    const songLabels = await extractSongLabels(url);

    //Step 2: Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) return;

    const userId = await getSpotifyUserId(userAccessToken);
    console.log("User ID:", userId);

    //Step 3: Search for tracks on Spotify and collect track IDs
    const trackIds = [];
    for (const label of songLabels) {
      const trackId = await searchSpotifyTrack(label, artistName, accessToken);
      if (trackId) {
        trackIds.push(trackId);
      }
    }

    //Step 4: Create a new Spotify playlist
    const playlistId = await createSpotifyPlaylist(
      userId,
      playlistName,
      userAccessToken
    );
    if (!playlistId) return;

    //Step 5: Add tracks to Spotify playlist
    await addTracksToSpotifyPlaylist(playlistId, trackIds, userAccessToken);
  }
}

export default APIController;
