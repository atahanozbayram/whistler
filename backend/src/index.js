require("module-alias/register");
require("dotenv").config();
const { app } = require("@root/src/app");

const port = process.env.PORT | 3000;

app.listen(port, () => {
	console.log(`example app listening on port ${port}`);
});
