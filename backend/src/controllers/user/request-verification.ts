import { Response, Router } from "express";
import { check } from "express-validator";
import { ErrorMessages, ValidationMessages } from "@shared/error-lib";
import { requestLoggerMiddlewareCreator as reqLgrMwCreator } from "@middlewares/request-logger.mw";
import { validationCheckMw } from "@middlewares/validation-checker.mw";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { sendVerificationEmail } from "@shared/user";
import { logger } from "@shared/logger";
import { prisma } from "@shared/prisma-original";

const reqVerifRoute = Router();

type reqVerifReqBody = {
	email: string;
};

const reqVerifValChain = [
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

// Controller meant to be used when a verification code is needed for new accounts.
const reqVerifCtrllr = function (req: TypedRequestBody<reqVerifReqBody>, res: Response) {
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
				console.log("error: %o", error);
			});

			res.status(200).json({ message: "verification code will be sent to your email address." });
		})
		.catch((error) => {
			logger.error(error);
			res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
		});
};

reqVerifRoute.use(reqLgrMwCreator(), reqVerifValChain, validationCheckMw, reqVerifCtrllr);
export { reqVerifRoute, reqVerifReqBody };
