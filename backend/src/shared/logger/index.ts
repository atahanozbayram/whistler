import winston from "winston";
import { makeDevelopmentLogger, myFormat } from "./development-logger";

const logger = makeDevelopmentLogger();

if (process.env.DEBUG === "on") {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), myFormat),
		})
	);
}

export { logger };
