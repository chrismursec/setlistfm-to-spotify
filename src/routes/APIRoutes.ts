import { config } from "dotenv";
import { Request, Response, Router } from "express";
import request from "request";
import APIController from "../controllers/APIController";

config();
class APIRoutes {
  private router: Router;
  private apiController: APIController;

  constructor() {
    this.router = Router();
    this.initRoutes();
    this.apiController = new APIController();
  }

  private initRoutes(): void {
    this.router.get("/callback", (req: Request, res: Response) => {
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

    this.router.post("/create-playlist", async (req: Request, res: Response) =>
      this.apiController.createPlaylist(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new APIRoutes().getRouter();
