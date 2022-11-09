import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const authorizationMw = function(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization?.split(" ");
	if (authHeader[0].toLowerCase() !== "bearer") {
		res.status(401).json({ message: "unauthorized" });
		return;
	}

	const token = authHeader[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err) => {
		if (err) {
			res.status(401).json({ message: "unauthorized" });
			return;
		}

		next();
	});
};

export { authorizationMw };
