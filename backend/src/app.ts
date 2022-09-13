import express from "express";
import bodyParser from "body-parser";
import { Controller } from "@shared/Controller";

class App {
	public app: express.Application;

	constructor(controllers?: Controller[]) {
		this.app = express();

		this.initializeMiddlewares();
		if (controllers) this.initializeControllers(controllers);
	}

	public listen() {
		const port = process.env.API_PORT ? process.env.API_PORT : 3000;
		this.app.listen(port, () => {
			console.log(`Server started listening on port ${port}.`);
		});
	}

	private initializeMiddlewares() {
		this.app.use(bodyParser.json());
	}

	private initializeControllers(controllers: Controller[]) {
		controllers.forEach((controller1) => {
			this.app.use("/", controller1.router);
		});
	}
}

export { App };
