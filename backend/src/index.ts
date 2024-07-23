import dotenv from "dotenv";
dotenv.config();
import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import { routes } from "./routes/routes";
import morgan from "morgan";
import { ErrorHandler } from "./common/middleware/error-handle";
const app = express();

const port = process.env.PORT;
const mongodbUrl = process.env.MONGODB_URL || "";
const mainURL = process.env.MAIN_URL;
app.use(morgan("common"));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", routes);
// app.use(ErrorHandler);

mongoose
  .connect(mongodbUrl)
  .then(() => {
    console.log("Connection Successfull");
  })
  .catch((err) => {
    console.log("Received an Error");
  });

app.listen(port, () => {
  console.log();
  console.log("Server started at " + mainURL + port);
});
