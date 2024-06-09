import { Router } from "express";
import path from "path";

class DocumentRoutes {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.get("/", (req, res) => {
      const filePath = path.join(__dirname, "../views/index.html");
      res.sendFile(filePath);
    });

    this.router.get("/about", (req, res) => {
      const filePath = path.join(__dirname, "../views/about.html");
      res.sendFile(filePath);
    });

    this.router.get("/privacy", (req, res) => {
      const filePath = path.join(__dirname, "../views/privacy.html");
      res.sendFile(filePath);
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default new DocumentRoutes().getRouter();
