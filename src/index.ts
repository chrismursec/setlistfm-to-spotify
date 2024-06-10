import dotenv from "dotenv";
import app from "./app";

dotenv.config();

const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
