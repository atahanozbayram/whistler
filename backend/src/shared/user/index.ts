import { Context } from "@shared/prisma-context";
import { v1 as uuidv1 } from "uuid";
import bcrypt from "bcrypt";
import { prisma as prismaOg } from "@shared/prisma-original";
import { user } from "@prisma/client";
/*
 * converts from uuidv1 string to 16 bytes hex code
 * @param uuid*/
const uuidToBinary = function (uuid: string) {
	const binary = Buffer.from(uuid.replaceAll("-", ""), "hex");
	return binary;
};

const saveCorrectDate = function (date: Date) {
	return new Date(Date.parse(date.toUTCString()) - date.getTimezoneOffset() * 60000);
};

/*
 * saves user into database
 * @param userInfo object contains information about user */

const saveUser: (
	userInfo: {
		firstname: string;
		lastname: string;
		email: string;
		gender: number;
		password: string;
		username: string;
		birth_date: Date;
	},
	ctx?: Context
) => Promise<user> = function (userInfo, ctx) {
	return new Promise((resolve, reject) => {
		ctx ??= { prisma: prismaOg } as Context;
		const { prisma } = ctx;
		const uuid_binary = uuidToBinary(uuidv1());

		bcrypt.hash(userInfo.password, 5).then((password_hash) => {
			prisma.user
				.create({
					data: {
						uuid: uuid_binary,
						firstname: userInfo.firstname,
						lastname: userInfo.lastname,
						email: userInfo.email,
						username: userInfo.username,
						birth_date: saveCorrectDate(userInfo.birth_date),
						password_hash: password_hash,
						gender: userInfo.gender,
						verified: false,
					},
				})
				.then((result) => {
					resolve(result);
				})
				.catch((error) => {
					reject(error);
				});
		});
	});
};

export { uuidToBinary, saveUser };
