const SpotifyApp = (function () {
  const clientId = "ba38ec33ae97465b860a00e2ac28a9fa";
  const redirectUri = "https://setlistfm-to-spotify.onrender.com/api/callback";
  const scope = "user-read-private user-read-email playlist-modify-public";

  function redirectToAuthorization() {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  }

  function getQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const userDetails = urlParams.get("userDetails");
    return JSON.parse(userDetails);
  }

  function saveUserDetailsToLocalStorage(userDetails) {
    localStorage.setItem("spotifyUserDetails", JSON.stringify(userDetails));
  }

  function createPlaylist() {
    const setlistFmLink = document.getElementById("setlistfm-link").value;
    const playlistName = document.getElementById("playlist-name").value;

    const userDetails = JSON.parse(localStorage.getItem("spotifyUserDetails"));
    const accessToken = userDetails.accessToken;

    fetch("https://setlistfm-to-spotify.onrender.com/api/create-playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playlistName,
        setlistFmLink,
        accessToken,
      }),
    })
      .then((response) => {
        if (response.status === 200) {
          document.getElementById("playlist-section").style.display = "none";
          document.getElementById("success-message").style.display = "block";
        } else {
          console.error("Error:", response);
          document.getElementById("fail-message").style.display = "block";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function init() {
    const userDetails = getQueryParams();
    if (userDetails) {
      saveUserDetailsToLocalStorage(userDetails);
    }

    if (localStorage.getItem("spotifyUserDetails")) {
      document.getElementById("login-section").style.display = "none";
      document.getElementById("playlist-section").style.display = "block";
    }
  }

  return {
    init,
    login: redirectToAuthorization,
    createPlaylist,
  };
})();

SpotifyApp.init();
