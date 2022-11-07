import { Request, Response } from "express";
import { TypedRequestBody } from "@shared/custom-types/express-related";
import { Controller } from "@shared/Controller";
import { ErrorMessages, ValidationMessages } from "@root/src/shared/error-lib";
import { prisma } from "@shared/prisma-original";
import _ from "lodash";
import { logger } from "@shared/logger";
import { check } from "express-validator";

type signOutReqBody = {
	refresh_token: string;
	all_devices: boolean;
};

class SignOut extends Controller {
	constructor() {
		super();
		this.setupRouter();
	}

	path = "/sign-out";
	validationChain = [
		check("refresh_token")
			.exists()
			.bail()
			.withMessage(ValidationMessages.exists())
			.isString()
			.bail()
			.withMessage(ValidationMessages.isType("string"))
			.isLength({ max: 128 })
			.bail()
			.withMessage(ValidationMessages.isLength({ max: 128 })),
		check("all_devices").optional({ nullable: true }).isBoolean().withMessage(ValidationMessages.isType("boolean")),
	];
	loggerManip = function(req: TypedRequestBody<signOutReqBody>) {
		const reqCopy = _.cloneDeep(req);
		reqCopy.body.refresh_token = "<CENSORED FOR SECURITY>";

		return reqCopy;
	};
	controller = function(req: TypedRequestBody<signOutReqBody>, res: Response) {
		const { refresh_token, all_devices } = req.body;
		// check if the refresh_token is valid. If not respond with 401.
		prisma.refresh_token
			.findFirst({ where: { code: refresh_token, validity: true } })
			.then((rtoken) => {
				if (rtoken === null) {
					res
						.status(401)
						.clearCookie("refresh_token", { httpOnly: true, sameSite: true, secure: true })
						.json({ message: "Invalid credentials" });
					return;
				}

				// update the refresh token(s) validity to false
				prisma.refresh_token
					.updateMany({
						where: { OR: [{ uuid: rtoken.uuid }, { user_uuid: all_devices ? rtoken.user_uuid : undefined }] },
						data: { validity: false },
					})
					.then(() => {
						res
							.status(200)
							.clearCookie("refresh_token", { httpOnly: true, sameSite: true, secure: true })
							.json({ message: `logged out successfully${all_devices ? " from all devices" : ""}.` });
					});
			})
			.catch((error) => {
				logger.error(error);
				res.status(500).json({ message: ErrorMessages.general.statusCode.code500 });
			});
	};
}

export { signOutReqBody, SignOut };
