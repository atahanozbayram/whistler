import { ErrorMessages, ValidationMessages } from "@shared/error-lib";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { Response } from "express";
import { check, oneOf } from "express-validator";
import _ from "lodash";
import { Controller } from "@shared/Controller";
import { prisma } from "@shared/prisma-original";
import bcrypt from "bcrypt";
import { logger } from "@shared/logger";
import { generateAccessToken, generateRefreshToken } from "@shared/user/refresh-token";

type signInReqBody = {
	username?: string;
	email?: string;
	password: string;
};

class SignIn extends Controller {
	constructor() {
		super();
		this.setupRouter();
	}

	path = "/sign-in";
	validationChain = [
		oneOf([
			check("username")
				.exists()
				.bail()
				.withMessage(ValidationMessages.exists())
				.isLength({ min: 4, max: 16 })
				.bail()
				.withMessage(ValidationMessages.isLength({ min: 4, max: 16 })),
			check("email")
				.exists()
				.bail()
				.withMessage(ValidationMessages.exists())
				.isEmail()
				.bail()
				.withMessage(ValidationMessages.isEmail()),
		]),
		check("password")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isLength({ min: 8, max: 24 })
			.bail()
			.withMessage(ValidationMessages.isLength({ min: 8, max: 24 })),
	];

	loggerManip = function(req: TypedRequestBody<signInReqBody>) {
		const reqCopy = _.cloneDeep(req);
		reqCopy.body.password = "<CENSORED FOR SECURITY>";

		return reqCopy;
	};

	controller = function(req: TypedRequestBody<signInReqBody>, res: Response) {
		const { email, username, password } = req.body;
		prisma.user
			.findFirst({
				where: {
					OR: [{ email: email }, { username: username }],
					verified: true,
				},
			})
			.then((user1) => {
				if (user1 === null) {
					res.status(401).json({ message: "Invalid credentials." });
					return;
				}

				// at this stage program checks for password matching
				bcrypt.compare(password, user1.password_hash).then((comp_result) => {
					// at this stage the credentials are true, proceed to create a refresh token and access token,
					// then deliver them to the user.

					if (comp_result === false) {
						res.status(401).json({ message: "Invalid credentials.1" });
						return;
					}
					generateRefreshToken(user1.uuid)
						.then((rtoken_code) => {
							generateAccessToken(rtoken_code).then((atoken) => {
								// store the refresh token in httpOnly cookie,
								res
									.status(200)
									.cookie("refresh_token", rtoken_code, { httpOnly: true, secure: true, sameSite: true })
									.json({ access_token: atoken });
							});
						})
						.catch((error) => {
							logger.error(error);
							res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
						});
				});
			})
			.catch((error) => {
				logger.error(error);
				res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
			});
	};
}

export { SignIn, signInReqBody };
