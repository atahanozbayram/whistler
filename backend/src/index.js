require("module-alias/register");
require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const port = process.env.PORT | 3000;
const { userRoute } = require("@root/src/routes/user/user.route");

const apiRoute = express.Router();
apiRoute.use("/user", userRoute);

app.use(bodyParser.json());

app.use("/api", apiRoute);
app.listen(port, () => {
	console.log(`example app listening on port ${port}`);
});
