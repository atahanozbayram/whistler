import "module-alias/register"; // remove this line later
import crypto from "crypto";
import { prisma } from "../prisma-original";
import { v1 as uuidv1 } from "uuid";
import { uuidToBinary } from ".";
import ms from "ms";
import date from "date-and-time";
import jwt from "jsonwebtoken";

const generateRefreshToken = function(user_uuid: Buffer, scope = "", expire_time = "15days"): Promise<string> {
	return new Promise((resolve, reject) => {
		prisma.user
			.findFirst({ where: { uuid: user_uuid } })
			.then((user1) => {
				if (user1 === null) {
					reject("Invalid uuid, no user exist with given uuid.");
					return;
				}

				const expire_date = date.addMilliseconds(new Date(Date.now()), ms(expire_time));

				const randomString = crypto.randomBytes(64).toString("hex");
				prisma.refresh_token
					.create({
						data: {
							uuid: uuidToBinary(uuidv1()),
							user_uuid: user_uuid,
							code: randomString,
							scope: scope,
							expires_at: expire_date,
							created_at: new Date(Date.now()),
							validity: true,
						},
					})
					.then((rtoken) => {
						resolve(rtoken.code);
					});
			})
			.catch((error) => reject(error));
	});
};

const generateAccessToken = function(rtoken_code: string, expire_time = "15m") {
	return new Promise((resolve, reject) => {
		prisma.refresh_token
			.findFirst({
				where: {
					code: rtoken_code, // code should exist by the given string.
					expires_at: { gt: new Date(Date.now()) }, // code should not expire.
					validity: true, // code should not be invalidated by user or in some other way.
				},
			})
			.then((rtoken) => {
				if (rtoken === null) {
					reject("refresh token is not found.");
					return;
				}
				prisma.user
					.findFirst({ where: { uuid: rtoken.user_uuid } })
					.then((user1) => {
						if (user1 === null) {
							reject("No user found with given uuid");
							return;
						}

						const atoken = jwt.sign(
							{
								user_uuid: user1.uuid,
								scope: rtoken.scope,
							},
							process.env.ACCESS_TOKEN_SECRET as string,
							{ expiresIn: expire_time }
						);

						resolve(atoken);
					})
					.catch((error) => reject(error));
			})
			.catch((error) => reject(error));
	});
};

export { generateRefreshToken, generateAccessToken };
