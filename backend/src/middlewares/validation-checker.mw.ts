import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

const validationCheckMV = function (req: Request, res: Response, next: NextFunction) {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	next();
};

export { validationCheckMV };
