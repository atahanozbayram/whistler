import { app } from "@src/app";

const port = process.env.API_PORT ? process.env.API_PORT : 3000;

app.listen(port, () => {
	console.log("Server started to listen");
});
