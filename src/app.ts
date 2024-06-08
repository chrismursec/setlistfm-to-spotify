import express, { Express, json, urlencoded } from "express";
// import AuthRoutes from "./routes/AuthRoutes";
import APIRoutes from "./routes/APIRoutes";
import DocumentRoutes from "./routes/DocumentRoutes";

const app: Express = express();

app.use(json());
app.use(
  urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));

app.use("/", DocumentRoutes);
app.use("/api", APIRoutes);
// app.use("/api/auth", AuthRoutes);

export default app;
