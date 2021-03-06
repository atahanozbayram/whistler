import * as dotenv from "dotenv";
import path from "path";

const config = function (): string {
	const envFilePath = `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ""}`;

	dotenv.config({
		path: path.resolve("./", envFilePath),
	});
	return envFilePath;
};

export { config };
