import { saveUser } from "@root/src/shared/user";
import { NextFunction, Response, Router } from "express";
import { check } from "express-validator";
import { ValidationMessages, ErrorMessages } from "@shared/error-lib";
import { logger } from "@root/src/shared/logger";
import { prisma } from "@shared/prisma-original";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { validationCheckMV } from "@middlewares/validation-checker.mw";
import { requestLoggerMiddlewareCreator } from "@middlewares/request-logger.mw";
import _ from "lodash";

const signUpRoute = Router();

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

const requestCensorer = function (req: TypedRequestBody<signUpReqBody>) {
	const reqCopy = _.cloneDeep(req);
	reqCopy.body.password = "<CENSORED FOR SECURITY>";
	reqCopy.body.password_confirmation = "<CENSORED FOR SECURITY>";

	return reqCopy;
};

const signUpValidation = [
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
		.withMessage("must be a valid email address.")
		.isLength({ max: 255 })
		.bail()
		.withMessage(ValidationMessages.isLength({ max: 255 })),
	check("birth_date")
		.exists()
		.bail()
		.withMessage(ValidationMessages.exists())
		.isDate()
		.bail()
		.withMessage(ValidationMessages.isType("Date")),
	check("gender").isNumeric().bail().withMessage(ValidationMessages.isType("number")),
	check("username")
		.exists()
		.bail()
		.withMessage(ValidationMessages.exists())
		.isLength({ min: 8, max: 16 })
		.bail()
		.withMessage(ValidationMessages.isLength({ min: 8, max: 16 })),
	check("password")
		.exists()
		.bail()
		.withMessage(ValidationMessages.exists())
		.isLength({ min: 8, max: 16 })
		.bail()
		.withMessage(ValidationMessages.isLength({ min: 8, max: 16 }))
		.isStrongPassword({ minNumbers: 1, minSymbols: 1, minLowercase: 1, minUppercase: 1 })
		.bail()
		.withMessage("Password should have at least 1 number, symbol, lowercase and uppercase character"),
	check("password_confirmation").exists().bail().withMessage(ValidationMessages.exists()),
];

const signUp = function (req: TypedRequestBody<signUpReqBody>, res: Response) {
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
		});
};

signUpRoute.use(requestLoggerMiddlewareCreator(requestCensorer), signUpValidation, validationCheckMV, signUp);
export { signUpRoute, signUpValidation, signUpReqBody };
