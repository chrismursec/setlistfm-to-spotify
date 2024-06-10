# SetlistFM To Spotify!

Welcome to SetlistFM to Spotify. This is a totally open sourced simple application that allows you to generate Spotify playlists from a SetlistFM URL. The app itself is built with TypeScript and Express paired with plain old HTML.

Simply login with your Spotify credentials and then paste in your SetlistFM URL and a playlist name. From there, you can either generate the full playlist, or selected tracks from the setlist. And then the playlist will be ready in your spotify app!

Perfect if you've got a gig coming up and you want to learn the setlist beforehand.

The app can be found here: https://setlistfm-to-spotify.onrender.com/

# Running Locally

To run this app locally, you will need to create a Spotify Developer account and create an app. From there, clone this repo and create a .env file in the root directory, following the .env.example file. You will need to fill in the CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI fields with your own Spotify Developer app details.

To set up a spotify developer account, go to https://developer.spotify.com/dashboard/applications and create a new app. From there, you will be able to get your client id and client secret.