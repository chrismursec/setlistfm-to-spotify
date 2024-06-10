import { config } from "dotenv";
import { Request, Response, Router } from "express";
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
    this.router.get("/callback", (req: Request, res: Response) =>
      this.apiController.loginCallback(req, res)
    );

    this.router.post("/create-playlist", async (req: Request, res: Response) =>
      this.apiController.createPlaylist(req, res)
    );

    this.router.post(
      "/manual-create-playlist",
      async (req: Request, res: Response) =>
        this.apiController.manualCreatePlaylist(req, res)
    );

    this.router.post(
      "/manual-submit-playlist",
      async (req: Request, res: Response) =>
        this.apiController.manualSubmitPlaylist(req, res)
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new APIRoutes().getRouter();
