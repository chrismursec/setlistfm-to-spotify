import axios from 'axios';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import SpotifyHelper from '../helpers/SpotifyHelper';
dotenv.config();

class APIController {
	private spotifyHelper: SpotifyHelper = new SpotifyHelper();

	public async loginCallback(req: Request, res: Response): Promise<void> {
		const code = req.query.code as string;

		if (!code) {
			res.status(400).json({ error: 'Missing authorization code' });
			return;
		}

		try {
			const tokenResponse = await axios.post(
				'https://accounts.spotify.com/api/token',
				new URLSearchParams({
					code,
					redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
					grant_type: 'authorization_code'
				}),
				{
					headers: {
						Authorization: `Basic ${Buffer.from(
							`${process.env.SPOTIFY_CLIENT_ID!}:${process.env.SPOTIFY_CLIENT_SECRET!}`
						).toString('base64')}`,
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				}
			);

			const { access_token: accessToken } = tokenResponse.data;

			const userDetails = { accessToken };

			res.redirect(`/?userDetails=${encodeURIComponent(JSON.stringify(userDetails))}`);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.error('Error in login callback:', error.response?.data || error.message);
				res.status(error.response?.status || 500).json({ error: 'An unexpected error occurred' });
			} else {
				console.error('Unexpected error in login callback:', error);
				res.status(500).json({ error: 'An unexpected error occurred' });
			}
		}
	}

	private async processTracks(setlistFmLink: string): Promise<{ trackIds: string[]; artistName: string }> {
		const url = setlistFmLink;
		const songLabels = await this.spotifyHelper.extractSongLabels(url);
		const artistName = await this.spotifyHelper.extractArtist(url);

		const accessToken = await this.spotifyHelper.getSpotifyAccessToken();
		if (!accessToken) throw new Error('Failed to get Spotify access token');

		const trackIds = await Promise.all(
			songLabels.map(async (label) => {
				const trackId = await this.spotifyHelper.searchSpotifyTrack(label, artistName, accessToken);
				return trackId || '';
			})
		);

		return { trackIds: trackIds.filter((id) => id !== ''), artistName };
	}

	private async createPlaylistOnSpotify(
		userAccessToken: string,
		playlistName: string,
		trackIds: string[]
	): Promise<string | null> {
		const userId = await this.spotifyHelper.getSpotifyUserId(userAccessToken);
		const playlistId = await this.spotifyHelper.createSpotifyPlaylist(userId, playlistName, userAccessToken);
		if (!playlistId) return null;

		await this.spotifyHelper.addTracksToSpotifyPlaylist(playlistId, trackIds, userAccessToken);
		return playlistId;
	}

	public async manualCreatePlaylist(req: Request, res: Response): Promise<void> {
		try {
			const { accessToken, setlistFmLink } = req.body;
			const { trackIds } = await this.processTracks(setlistFmLink);

			const trackObjects = await Promise.all(
				trackIds.map((trackId) => this.spotifyHelper.getTrack(trackId, accessToken))
			);

			let html = trackObjects
				.map(
					(trackObject) => `
        <div class="track" data-trackid="${trackObject.id}">
          <div class="track-image"><img src="${trackObject.album.images[0].url}" alt="${trackObject.name}"></div>
          <div class="track-details">
            <div class="track-info track-name">${trackObject.name}</div>
            <div class="track-info track-album">${trackObject.album.name}</div>
          </div>
          <input type="checkbox" name="track" value="${trackObject.id}" class="track-checkbox">
        </div>`
				)
				.join('');

			html += `<button class="create-btn" id="manual-submit" onclick="SpotifyApp.manualCreatePlaylistSubmit()">Create Playlist</button>`;

			res.status(200).send(html);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.error('Error in manualCreatePlaylist:', error.response?.data || error.message);
				res.status(error.response?.status || 500).json({ error: 'An unexpected error occurred' });
			} else {
				console.error('Error in manualCreatePlaylist:', error);
				res.status(500).json({ error: 'An unexpected error occurred' });
			}
		}
	}

	public async manualSubmitPlaylist(req: Request, res: Response): Promise<void> {
		try {
			const { trackIds, accessToken, playlistName } = req.body;
			const playlistId = await this.createPlaylistOnSpotify(accessToken, playlistName, trackIds);
			if (!playlistId) throw new Error('Failed to create playlist');

			res.status(200).json({ success: 'Playlist created successfully' });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.error('Error in manualSubmitPlaylist:', error.response?.data || error.message);
				res.status(error.response?.status || 500).json({ error: 'An unexpected error occurred' });
			} else {
				console.error('Error in manualSubmitPlaylist:', error);
				res.status(500).json({ error: 'An unexpected error occurred' });
			}
		}
	}

	public async createPlaylist(req: Request, res: Response): Promise<void> {
		try {
			const { accessToken, setlistFmLink, playlistName } = req.body;
			const { trackIds } = await this.processTracks(setlistFmLink);
			const playlistId = await this.createPlaylistOnSpotify(accessToken, playlistName, trackIds);
			if (!playlistId) throw new Error('Failed to create playlist');

			res.status(200).json({ success: 'Playlist created successfully' });
		} catch (error) {
			if (axios.isAxiosError(error)) {
				console.error('Error in createPlaylist:', error.response?.data || error.message);
				res.status(error.response?.status || 500).json({ error: 'An unexpected error occurred' });
			} else {
				console.error('Error in createPlaylist:', error);
				res.status(500).json({ error: 'An unexpected error occurred' });
			}
		}
	}
}

export default APIController;
