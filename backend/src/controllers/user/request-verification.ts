import { Request, Response } from "express";
import { check } from "express-validator";
import { ErrorMessages, ValidationMessages } from "@shared/error-lib";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { sendVerificationEmail } from "@shared/user/verification";
import { logger } from "@shared/logger";
import { prisma } from "@shared/prisma-original";
import { Controller } from "@shared/Controller";

type reqVerifReqBody = {
	email: string;
};

class RequestVerification extends Controller {
	constructor() {
		super();
		this.setupRouter();
	}

	path = "/request-verification";

	validationChain = [
		check("email")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isEmail()
			.bail()
			.withMessage(ValidationMessages.isEmail())
			.isLength({ max: 255 })
			.bail()
			.withMessage(ValidationMessages.isLength({ max: 255 })),
	];

	loggerManip = function (req: Request) {
		return req;
	};

	controller = function (req: TypedRequestBody<reqVerifReqBody>, res: Response) {
		const { email } = req.body;

		// first check if the given email is already inside the database and is not verified.
		prisma.user
			.findFirst({ where: { email: email, verified: false } })
			.then((user1) => {
				if (user1 === null) {
					res
						.status(400)
						.json({ message: ErrorMessages.controllers.user.requestVerification.alreadyVerifiedOrNonExistent });
					return;
				}

				// can't wait for the promise to resolve, must send response immediately to avoid http client hanging.
				sendVerificationEmail({ user_email: email }).catch((error) => {
					logger.error(error);
				});

				res.status(200).json({ message: "verification code will be sent to your email address." });
			})
			.catch((error) => {
				logger.error(error);
				res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
			});
	};
}

export { RequestVerification, reqVerifReqBody };
