const express = require("express");
const bodyParser = require("body-parser");
const app = express();

const { userRoute } = require("@routes/user/user.route");

app.use(bodyParser.json());

const apiRoute = express.Router();
apiRoute.use("/user", userRoute);

app.use("/api", apiRoute);

module.exports = { app };
