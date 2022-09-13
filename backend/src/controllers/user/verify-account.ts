import { prisma } from "@root/src/shared/prisma-original";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { Response } from "express";
import { logger } from "@shared/logger";
import { ErrorMessages, ValidationMessages } from "@root/src/shared/error-lib";
import { check } from "express-validator";
import { Controller } from "@shared/Controller";
import { Request } from "express-serve-static-core";

type verifAccReqBody = {
	email: string;
	verification_code: string;
};

class VerifyAccount extends Controller {
	constructor() {
		super();
		this.setupRouter();
	}
	path = "/verify-account";
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
		check("verification_code").exists().bail().withMessage(ValidationMessages.exists()).isLength({ max: 6 }),
	];

	loggerManip = function (req: Request) {
		return req;
	};
	controller = function (req: TypedRequestBody<verifAccReqBody>, res: Response) {
		const { email, verification_code } = req.body;

		// first check if the given email is existing in the database
		prisma.user
			.findFirst({ where: { email: email }, orderBy: { created_at: "desc" } })
			.then((user1) => {
				// first check if the given email even exists in the database, and send response.
				if (user1 === null) {
					res.status(400).json({ message: "Email is not registered." });
					return;
				}

				// if the email is already verified send response.
				if (user1.verified === true) {
					res.status(400).json({ message: "Email already verified." });
					return;
				}

				// at this point of code, we have an email that can be verified.
				// check for verification code that is valid and compare the given code, if the code doesn't match,
				// decrease the attempt left column of the verification.
				prisma.user_verification
					.findFirst({
						where: { user_uuid: user1.uuid, valid: true, expires_at: { gt: new Date(Date.now()) } },
					})
					.then((verification) => {
						// check if there is verification code is null, if so send response.
						if (verification === null) {
							res.status(400).json({ message: "There is no valid verification code exist for the user." });
							return;
						}

						// check if the verification code has enough attempts left
						if (verification.attempts_left <= 0) {
							res.status(400).json({ message: "Too many invalid verification attempts, try again later." });
							return;
						}

						// check if the given verification code is not valid, if so, decrease the attempts left.
						if (verification.code !== verification_code) {
							prisma.user_verification
								.update({
									where: { uuid: verification.uuid },
									data: { attempts_left: { decrement: 1 } },
								})
								.then(() => {
									res.status(400).json({ message: "invalid verification code attempt." });
								})
								.catch((error) => {
									logger.error(error);
									res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
								});
							return;
						}

						// if the code reaches here that means the code is valid, and then what we do is change verified status of user
						// and valid status of the verification code.
						prisma.user.update({ where: { uuid: user1.uuid }, data: { verified: true } }).then(() => {
							// update the verification code validity.
							prisma.user_verification
								.update({ where: { uuid: verification.uuid }, data: { valid: false } })
								.then(() => {
									res.status(200).json({ message: "Email has been verified." });
									return;
								});
						});
					});
			})
			.catch((error) => {
				logger.error(error);
				res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
			});
	};
}

export { VerifyAccount, verifAccReqBody };
