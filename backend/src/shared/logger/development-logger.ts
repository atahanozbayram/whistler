import winston from "winston";
import path from "path";
import process from "process";

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const log_file_path: string = process.env.LOG_FILE_PATH ? process.env.LOG_FILE_PATH : `${process.env.NODE_ENV}.log`;

const makeDevelopmentLogger = function () {
	return winston.createLogger({
		level: "silly",
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), myFormat),
			}),
			new winston.transports.File({
				filename: log_file_path,
				format: winston.format.combine(
					winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
					winston.format.metadata({ fillExcept: ["message", "level", "timestamp", "label"] }),
					myFormat,
					winston.format.json()
				),
				// format: winston.format.combine(winston.format.timestamp(), myFormat),
			}),
		],
	});
};

export { makeDevelopmentLogger };
