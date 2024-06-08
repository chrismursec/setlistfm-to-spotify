import dotenv from "dotenv";
import { Router } from "express";
import request from "request";
import {
  addTracksToSpotifyPlaylist,
  createSpotifyPlaylist,
  extractSongLabels,
  getSpotifyAccessToken,
  getSpotifyUserId,
  searchSpotifyTrack,
} from "./helpers/spotify-helpers";
dotenv.config();

class APIRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get("/callback", (req, res) => {
      const code = req.query.code;
      console.log(code);

      const authOptions = {
        url: "https://accounts.spotify.com/api/token",
        form: {
          code: code,
          redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
          grant_type: "authorization_code",
        },
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              process.env.SPOTIFY_CLIENT_ID +
                ":" +
                process.env.SPOTIFY_CLIENT_SECRET
            ).toString("base64"),
        },
        json: true,
      };

      request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const accessToken = body.access_token;
          const refreshToken = body.refresh_token;

          // Fetch user details from Spotify API
          request.get(
            "https://api.spotify.com/v1/me",
            {
              headers: {
                Authorization: "Bearer " + accessToken,
              },
              json: true,
            },
            (error, response, body) => {
              if (!error && response.statusCode === 200) {
                const userDetails = {
                  displayName: body.display_name,
                  email: body.email,
                  imageUrl: body.images.length > 0 ? body.images[0].url : null,
                  accessToken: accessToken,
                };
                // Redirect back to the login page with user details as query parameters
                res.redirect(`/?userDetails=${JSON.stringify(userDetails)}`);
              } else {
                res.status(response.statusCode).json({
                  error: "Error fetching user details from Spotify API",
                });
              }
            }
          );
        } else {
          console.log(error);
          console.log(response.statusCode);
          res.status(response.statusCode).json({
            error: "Error exchanging authorization code for access token",
          });
        }
      });
    });

    this.router.post("/create-playlist", async (req, res) => {
      let userAccessToken = req.body.accessToken;
      let setlistFmLink = req.body.setlistFmLink;
      let playlistName = req.body.playlistName;
      let artistName = req.body.artistName;

      const url = setlistFmLink; // Replace with the URL you want to fetch

      // Step 1: Extract song labels from setlist.fm
      const songLabels = await extractSongLabels(url);
      // console.log("Song Labels:", songLabels);

      // Step 2: Get Spotify access token
      const accessToken = await getSpotifyAccessToken();
      if (!accessToken) return;
      // console.log("Access Token:", accessToken);

      const userId = await getSpotifyUserId(userAccessToken);
      console.log("User ID:", userId);

      // // Step 3: Search for tracks on Spotify and collect track IDs
      const trackIds = [];
      for (const label of songLabels) {
        const trackId = await searchSpotifyTrack(
          label,
          artistName,
          accessToken
        );
        if (trackId) {
          trackIds.push(trackId);
        }
      }

      // console.log(trackIds);

      // // // Step 4: Create a new Spotify playlist
      const playlistId = await createSpotifyPlaylist(
        userId,
        playlistName,
        userAccessToken
      );
      if (!playlistId) return;

      // // // Step 5: Add tracks to Spotify playlist
      await addTracksToSpotifyPlaylist(playlistId, trackIds, userAccessToken);
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new APIRoutes().getRouter();
