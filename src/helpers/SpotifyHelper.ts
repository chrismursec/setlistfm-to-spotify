import axios, { AxiosRequestConfig } from "axios";
import cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();

class SpotifyHelper {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    this.redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  }

  private async fetchHtml(url: string): Promise<string | null> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Could not fetch the page: ${error}`);
      return null;
    }
  }

  public async extractArtist(url: string): Promise<any> {
    const html = await this.fetchHtml(url);
    if (html) {
      const $ = cheerio.load(html);
      const artist = $('meta[property="qc:artist"]').attr("content");
      return artist;
    }
    return null;
  }

  public async extractSongLabels(url: string): Promise<string[]> {
    const html = await this.fetchHtml(url);
    if (html) {
      const $ = cheerio.load(html);
      const songLabels: string[] = [];
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

  public async getSpotifyAccessToken(): Promise<string | null> {
    const authOptions: AxiosRequestConfig = {
      method: "post",
      url: "https://accounts.spotify.com/api/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(this.clientId + ":" + this.clientSecret).toString(
            "base64"
          ),
      },
      data: "grant_type=client_credentials",
    };

    try {
      const response = await axios(authOptions);
      return response.data.access_token;
    } catch (error) {
      console.error("Error fetching Spotify access token:", error);
      return null;
    }
  }

  public async searchSpotifyTrack(
    trackName: string,
    artist: string | null,
    accessToken: string
  ): Promise<string | null> {
    const searchOptions: AxiosRequestConfig = {
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
      const response = await axios(searchOptions);
      const tracks = response.data.tracks.items;
      return tracks.length > 0 ? tracks[0].id : null;
    } catch (error) {
      console.error("Error searching for track on Spotify:", error);
      return null;
    }
  }

  public async createSpotifyPlaylist(
    userId: string | null,
    playlistName: string,
    userAccessToken: string
  ): Promise<string | null> {
    const createOptions: AxiosRequestConfig = {
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
      const response = await axios(createOptions);
      return response.data.id;
    } catch (error) {
      console.error("Error creating Spotify playlist:", error);
      return null;
    }
  }

  public async addTracksToSpotifyPlaylist(
    playlistId: string,
    trackIds: string[],
    accessToken: string
  ): Promise<void> {
    const addOptions: AxiosRequestConfig = {
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
      await axios(addOptions);
      console.log("Tracks added to playlist successfully");
    } catch (error) {
      console.error("Error adding tracks to Spotify playlist:", error);
    }
  }

  public async getSpotifyUserId(accessToken: string): Promise<string | null> {
    const userProfileOptions: AxiosRequestConfig = {
      method: "get",
      url: "https://api.spotify.com/v1/me",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios(userProfileOptions);
      return response.data.id;
    } catch (error: any) {
      console.error("Error fetching Spotify user ID:", error.response.data);
      return null;
    }
  }
}

export default SpotifyHelper;
