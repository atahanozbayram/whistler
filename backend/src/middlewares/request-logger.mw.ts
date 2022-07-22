import { Request, Response, NextFunction } from "express";
import { requestLogger } from "@shared/request-logger";
import _ from "lodash";

const requestLoggerMiddlewareCreator = function (reqCensoringFunc?: (req: Request) => Request) {
	return function (req: Request, res: Response, next: NextFunction) {
		let reqCopy = req;
		if (reqCensoringFunc) {
			reqCopy = reqCensoringFunc(_.cloneDeep(req));
		}

		requestLogger(reqCopy);
		next();
	};
};

export { requestLoggerMiddlewareCreator };
