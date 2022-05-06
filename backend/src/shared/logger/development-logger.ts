import winston from "winston";

const myFormat = winston.format.printf(({ level, message, timestamp }) => {
	return `${timestamp} ${level}: ${message}`;
});

const log_file_path = process.env.LOG_FILE_PATH | `${process.env.NODE_ENV}.log`;

const makeDevelopmentLogger = function () {
	return winston.createLogger({
		level: "silly",
		transports: [
			new winston.transports.Console({
				format: winston.format.combine(winston.format.colorize(), winston.format.timestamp(), myFormat),
			}),
			new winston.transports.File({
				filename: log_file_path,
				format: winston.format.combine(winston.format.timestamp(), myFormat),
			}),
		],
	});
};

export { makeDevelopmentLogger };
