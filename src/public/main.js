const SpotifyApp = (function () {
	const clientId = 'ba38ec33ae97465b860a00e2ac28a9fa';
	const redirectUri = 'http://localhost:8080/api/callback'; // Change to production URL when needed
	const scope = 'user-read-private playlist-modify-public';

	const apiEndpoints = {
		createPlaylist: 'http://localhost:8080/api/create-playlist',
		manualCreatePlaylist: 'http://localhost:8080/api/manual-create-playlist',
		manualSubmitPlaylist: 'http://localhost:8080/api/manual-submit-playlist'
	};

	function redirectToAuthorization() {
		window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
	}

	function getQueryParams() {
		const urlParams = new URLSearchParams(window.location.search);
		const userDetails = urlParams.get('userDetails');
		return JSON.parse(userDetails);
	}

	function setCookie(name, value, hours) {
		const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
		document.cookie = `${name}=${value};expires=${expires};path=/`;
	}

	function getCookie(name) {
		const nameEQ = `${name}=`;
		const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
		for (const cookie of cookies) {
			if (cookie.startsWith(nameEQ)) {
				return cookie.substring(nameEQ.length);
			}
		}
		return null;
	}

	function saveUserDetailsToCookie(userDetails) {
		setCookie('spotifyUserDetails', JSON.stringify(userDetails), 1);
	}

	function displayElement(id, displayStyle) {
		document.getElementById(id).style.display = displayStyle;
	}

	function fetchPlaylist(apiUrl, bodyData, onSuccess, onError) {
		fetch(apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(bodyData)
		})
			.then((response) => {
				if (response.ok) {
					onSuccess(response);
				} else {
					onError(response);
				}
			})
			.catch(onError);
	}

	function handleCreatePlaylist(apiUrl) {
		displayElement('playlist-button-group', 'none');
		displayElement('progress-bar', 'block');

		const setlistFmLink = document.getElementById('setlistfm-link').value;
		const playlistName = document.getElementById('playlist-name').value;
		const userDetails = JSON.parse(getCookie('spotifyUserDetails'));
		const accessToken = userDetails.accessToken;

		fetchPlaylist(
			apiUrl,
			{ playlistName, setlistFmLink, accessToken },
			(response) => {
				displayElement('progress-bar', 'none');
				if (apiUrl === apiEndpoints.manualCreatePlaylist) {
					response.text().then((data) => {
						displayElement('tracklist', 'block');
						document.getElementById('tracklist').innerHTML = data;
						document.querySelectorAll('.track').forEach((track) => {
							track.addEventListener('click', (event) => {
								if (event.target.type !== 'checkbox') {
									const checkbox = track.querySelector('.track-checkbox');
									checkbox.checked = !checkbox.checked;
								}
							});
						});
					});
				} else {
					displayElement('site-info', 'none');
					displayElement('playlist-section', 'none');
					displayElement('success-message', 'block');
				}
			},
			(error) => {
				console.error('Error:', error);
				displayElement('progress-bar', 'none');
				displayElement('fail-message', 'block');
			}
		);
	}

	function createPlaylist() {
		handleCreatePlaylist(apiEndpoints.createPlaylist);
	}

	function manualCreatePlaylist() {
		handleCreatePlaylist(apiEndpoints.manualCreatePlaylist);
	}

	function manualCreatePlaylistSubmit() {
		const setlistFmLink = document.getElementById('setlistfm-link').value;
		const playlistName = document.getElementById('playlist-name').value;
		const userDetails = JSON.parse(getCookie('spotifyUserDetails'));
		const accessToken = userDetails.accessToken;

		const trackIds = Array.from(document.querySelectorAll('.track-checkbox:checked')).map((checkbox) => checkbox.value);

		fetchPlaylist(
			apiEndpoints.manualSubmitPlaylist,
			{ playlistName, setlistFmLink, trackIds, accessToken },
			() => {
				displayElement('site-info', 'none');
				displayElement('tracklist', 'none');
				displayElement('playlist-section', 'none');
				displayElement('success-message', 'block');
			},
			(error) => {
				console.error('Error:', error);
				displayElement('fail-message', 'block');
			}
		);
	}

	function init() {
		const userDetails = getQueryParams();
		if (userDetails) saveUserDetailsToCookie(userDetails);

		if (getCookie('spotifyUserDetails')) {
			displayElement('login-section', 'none');
			displayElement('playlist-section', 'block');
		}
	}

	return {
		init,
		login: redirectToAuthorization,
		createPlaylist,
		manualCreatePlaylist,
		manualCreatePlaylistSubmit
	};
})();

SpotifyApp.init();
