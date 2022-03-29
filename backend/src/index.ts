import "module-alias/register";
import { config } from "@shared/config";
import express from "express";

config();

console.log("It should recompile right now");
console.log("process.env: %o", process.env);

const app = express();

app.listen(3000, () => console.log("server is listening"));
// import { app } from "@root/src/app";
//
// const port = process.env.PORT | 3000;
//
// app.listen(port, () => {
// 	console.log(`example app listening on port ${port}`);
// });
