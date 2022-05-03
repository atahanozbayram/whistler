import { prisma } from "@shared/prisma-client";
import { v1 as uuidv1 } from "uuid";
import bcrypt from "bcrypt";
/*
 * converts from uuidv1 string to 16 bytes hex code
 * @param uuid*/
const uuidToBinary = function (uuid: string) {
	const binary = Buffer.from(uuid.replaceAll("-", ""), "hex");
	return binary;
};

/*
 * saves user into database
 * @param userInfo object contains information about user */

const saveUser = function (userInfo: {
	firstname: string;
	lastname: string;
	gender: number;
	password: string;
	username: string;
	birth_date: Date;
}) {
	return new Promise((resolve, reject) => {
		const uuid_binary = uuidToBinary(uuidv1());

		bcrypt.hash(userInfo.password, 5).then((password_hash) => {
			prisma.user
				.create({
					data: {
						uuid: uuid_binary,
						firstname: userInfo.firstname,
						lastname: userInfo.lastname,
						username: userInfo.username,
						birth_date: userInfo.birth_date,
						password_hash: password_hash,
						gender: userInfo.gender,
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
