import { Request, Response, NextFunction, Router } from "express";
import { ValidationChain, validationResult } from "express-validator";
import _ from "lodash";
import { requestLogger } from "./request-logger";

abstract class Controller {
	path: string;
	router: Router = Router();
	loggerManip: (req: Request) => Request;
	// eslint-disable-next-line
	validationChain: ValidationChain[] | any;
	controller: (req: Request, res: Response, next?: NextFunction) => void;

	public setupRouter() {
		this.router.use(
			this.path,
			Controller.loggerMw(),
			this.validationChain,
			Controller.validationCheckMw,
			this.controller
		);
	}

	/*
	 * @param reqManipulator a function manipulates req and resturns it
	 */
	public static loggerMw = function (reqManipulator?: (req: Request) => Request) {
		return function (req: Request, res: Response, next: NextFunction) {
			let reqCopy = req;
			if (reqManipulator) {
				reqCopy = reqManipulator(_.cloneDeep(req));
			}

			requestLogger(reqCopy);
			next();
		};
	};

	public static validationCheckMw = function (req: Request, res: Response, next: NextFunction) {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		next();
	};
}

export { Controller };
