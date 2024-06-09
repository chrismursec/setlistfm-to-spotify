// Function to initiate the login process
function login() {
  const clientId = "ba38ec33ae97465b860a00e2ac28a9fa"; // Replace with your Spotify client ID
  const redirectUri = "http://localhost:8080/api/callback"; // Replace with your redirect URI
  const scope = "user-read-private user-read-email playlist-modify-public"; // Adjust scopes as needed

  // Redirect the user to Spotify authorization page
  window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
}

// Function to get query parameters from the URL
function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const userDetails = urlParams.get("userDetails");
  return JSON.parse(userDetails);
}

// Function to save user details to local storage
function saveUserDetailsToLocalStorage(userDetails) {
  localStorage.setItem("spotifyUserDetails", JSON.stringify(userDetails));
}

// Check if the URL contains user details
const userDetails = getQueryParams();
if (userDetails) {
  saveUserDetailsToLocalStorage(userDetails);
}

function createPlaylist() {
  let artistName = document.getElementById("artist-name").value;
  let setlistFmLink = document.getElementById("setlistfm-link").value;
  let playlistName = document.getElementById("playlist-name").value;

  // get access token from local storage
  const userDetails = JSON.parse(localStorage.getItem("spotifyUserDetails"));
  const accessToken = userDetails.accessToken;

  //post to localhost:3000/create-playlist
  fetch("http://localhost:8080/api/create-playlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      artistName: artistName,
      playlistName: playlistName,
      setlistFmLink: setlistFmLink,
      accessToken: accessToken,
    }),
  })
    .then((response) => {
      if (response.status === 200) {
        // hide form and show success message
        document.getElementById("playlist-section").style.display = "none";
        document.getElementById("success-message").style.display = "block";
      } else {
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

if (localStorage.getItem("spotifyUserDetails")) {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("playlist-section").style.display = "block";
}
