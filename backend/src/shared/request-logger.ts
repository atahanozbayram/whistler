import { Request } from "express";
import { logger } from "@shared/logger";

const requestLogger = function (req: Request) {
	logger.info(`request body: ${JSON.stringify(req.body)}`, { ...req });
};

export { requestLogger };
