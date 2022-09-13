import { saveUser } from "@root/src/shared/user";
import { Response } from "express";
import { check, ValidationChain } from "express-validator";
import { ValidationMessages, ErrorMessages } from "@shared/error-lib";
import { logger } from "@shared/logger";
import { prisma } from "@shared/prisma-original";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { Controller } from "@shared/Controller";
import _ from "lodash";

type signUpReqBody = {
	firstname: string;
	lastname: string;
	email: string;
	birth_date: string;
	gender: number;
	username: string;
	password: string;
	password_confirmation: string;
};

class SignUp extends Controller {
	constructor() {
		super();
		this.setupRouter();
	}

	path = "/sign-up";
	validationChain: ValidationChain[] = [
		check("firstname")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.notEmpty()
			.bail()
			.withMessage(ValidationMessages.notEmpty())
			.isLength({ max: 48 })
			.bail()
			.withMessage(ValidationMessages.isLength({ max: 48 })),
		check("lastname")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isLength({ max: 48 })
			.bail()
			.withMessage(ValidationMessages.isLength({ max: 48 })),
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
		check("birth_date")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isDate({ format: "yyyy-mm-dd" })
			.bail()
			.withMessage(ValidationMessages.isType("Date")),
		check("gender").isNumeric().bail().withMessage(ValidationMessages.isType("number")),
		check("username")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isLength({ min: 4, max: 16 })
			.bail()
			.withMessage(ValidationMessages.isLength({ min: 4, max: 16 })),
		check("password")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isLength({ min: 8, max: 24 })
			.bail()
			.withMessage(ValidationMessages.isLength({ min: 8, max: 24 }))
			.isStrongPassword({ minNumbers: 1, minSymbols: 1, minLowercase: 1, minUppercase: 1 })
			.bail()
			.withMessage("Password should have at least 1 number, symbol, lowercase and uppercase character"),
		check("password_confirmation").exists().bail().withMessage(ValidationMessages.exists()),
	];

	loggerManip = function (req: TypedRequestBody<signUpReqBody>) {
		const reqCopy = _.cloneDeep(req);
		reqCopy.body.password = "<CENSORED FOR SECURITY>";
		reqCopy.body.password_confirmation = "<CENSORED FOR SECURITY>";

		return reqCopy;
	};

	controller = function (req: TypedRequestBody<signUpReqBody>, res: Response) {
		const { firstname, lastname, email, birth_date, gender, username, password, password_confirmation } = req.body;

		if (password !== password_confirmation) {
			return res.status(400).json({ message: "Passwords do not match." });
		}

		// check if the given email and/or username is already in use by a verified user.
		prisma.user
			.findFirst({ where: { OR: [{ email: email }, { username: username }], verified: true } })
			.then((userInfo) => {
				if (userInfo) {
					if (userInfo.email === email && userInfo.username == username) {
						res.status(400).json({ message: ErrorMessages.controllers.user.signUp.emailAndUsernameInUse });
					} else if (userInfo.email === email) {
						res.status(400).json({ message: ErrorMessages.controllers.user.signUp.emailInUse });
					} else {
						res.status(400).json({ message: ErrorMessages.controllers.user.signUp.usernameInUse });
					}
					return;
				}

				// if code reaches here, that means username and email is available and user now must be saved.
				saveUser({
					firstname: firstname,
					lastname: lastname,
					email: email,
					password: password,
					gender: gender,
					username: username,
					birth_date: new Date(birth_date),
				})
					.then((userInfo) => {
						return res
							.status(200)
							.json({ message: `User created with username: ${userInfo.username} and email: ${userInfo.email}` });
					})
					.catch((error) => {
						logger.error(error);
					});
			})
			.catch((error) => {
				logger.error(error);
				res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
			});
	};
}

export { SignUp, signUpReqBody };
