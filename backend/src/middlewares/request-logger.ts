import { Request, Response, NextFunction } from "express";
import { logger } from "@shared/logger";

const requestLogger = function (req: Request, res: Response, next: NextFunction) {
	logger.info("request: %o", req);
	next();
};

export { requestLogger };
