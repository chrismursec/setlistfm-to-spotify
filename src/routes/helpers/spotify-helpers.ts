import axios from "axios";
import cheerio from "cheerio";
import dotenv from "dotenv";
dotenv.config();

export const fetchHtml = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Could not fetch the page: ${error}`);
    return null;
  }
};

// Step 2: Extract song labels from setlist.fm
export const extractSongLabels = async (url: any) => {
  const html = await fetchHtml(url);
  if (html) {
    const $ = cheerio.load(html);
    const songLabels: any = [];
    $(".songLabel").each((index, element) => {
      const title = $(element).text();
      if (title) {
        songLabels.push(title);
      }
    });
    return songLabels;
  }
  return [];
};

// Step 3: Get Spotify access token
export const getSpotifyAccessToken = async () => {
  const authOptions = {
    method: "post",
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET
        ).toString("base64"),
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
};

// Step 4: Search for track on Spotify
export const searchSpotifyTrack = async (
  trackName: any,
  artist: any,
  accessToken: any
) => {
  const searchOptions = {
    method: "get",
    url: `https://api.spotify.com/v1/search`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    params: {
      q: trackName + " " + artist,
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
};

// Step 5: Create a new playlist
export const createSpotifyPlaylist = async (
  userId: any,
  playlistName: any,
  userAccessToken: any
) => {
  console.log("user access token", userAccessToken);
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
    const response = await axios(createOptions);
    return response.data.id;
  } catch (error) {
    console.error("Error creating Spotify playlist:", error);
    return null;
  }
};

// Step 6: Add tracks to playlist
export const addTracksToSpotifyPlaylist = async (
  playlistId: any,
  trackIds: any,
  accessToken: any
) => {
  const addOptions = {
    method: "post",
    url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    data: {
      uris: trackIds.map((id: any) => `spotify:track:${id}`),
    },
  };

  try {
    await axios(addOptions);
    console.log("Tracks added to playlist successfully");
  } catch (error) {
    console.error("Error adding tracks to Spotify playlist:", error);
  }
};

export const getSpotifyUserId = async (accessToken: any) => {
  const userProfileOptions = {
    method: "get",
    url: "https://api.spotify.com/v1/me",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };

  try {
    const response = await axios(userProfileOptions);
    return response.data.id; // This is your Spotify user ID
  } catch (error: any) {
    console.error("Error fetching Spotify user ID:", error.response.data);
    return null;
  }
};
