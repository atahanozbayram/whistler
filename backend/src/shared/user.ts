import { Context } from "@shared/prisma-context";
import { v1 as uuidv1 } from "uuid";
import bcrypt from "bcrypt";
import { PrismaClient, user } from "@prisma/client";
import { transporter } from "@shared/mailer";
import otpGenerator from "otp-generator";
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
		ctx ??= { prisma: new PrismaClient() } as Context;
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

const saveVerificationCode: (user_uuid: Buffer, ctx?: Context) => Promise<string> = function (
	user_uuid: Buffer,
	ctx = { prisma: new PrismaClient() }
) {
	return new Promise((resolve, reject) => {
		ctx ??= { prisma: new PrismaClient() } as Context;
		const { prisma } = ctx;
		prisma.user
			.findFirst({ where: { uuid: user_uuid } })
			.then((userInfo) => {
				if (userInfo === null) return reject("user not found with given uuid.");

				const randomCode = otpGenerator.generate(6, {
					digits: true,
					specialChars: false,
					lowerCaseAlphabets: false,
					upperCaseAlphabets: false,
				});

				prisma.verification_code
					.create({
						data: { uuid: uuidToBinary(uuidv1()), code: randomCode, valid: true, user_uuid: user_uuid },
					})
					.then((verificationEntry) => {
						resolve(verificationEntry.code);
					})
					.catch((error) => reject(error));
			})
			.catch((error) => reject(error));
	});
};

const sendVerificationEmail: (
	{
		user_uuid,
		user_email,
	}: {
		user_uuid?: Buffer;
		user_email?: string;
	},
	ctx?: Context
) => Promise<unknown> = function ({ user_uuid, user_email }, ctx) {
	return new Promise((resolve, reject) => {
		ctx ??= { prisma: new PrismaClient() } as Context;
		const { prisma } = ctx;
		prisma.user
			.findFirst({
				where: { OR: [{ uuid: user_uuid }, { email: user_email }], verified: false },
				orderBy: { email: "desc" },
			})
			.then((userInfo) => {
				// check if userInfo is null, if so reject the Promise
				if (userInfo === null) {
					return reject("No verifiable user is found with given arguments.");
				}

				saveVerificationCode(userInfo.uuid)
					.then((verification_code) => {
						transporter
							.sendMail({ to: userInfo.email, text: `Your verification code is ${verification_code}.` })
							.then((messageInfo) => {
								resolve(messageInfo);
							})
							.catch((error) => reject(error));
					})
					.catch((error) => reject(error));
			})
			.catch((error) => reject(error));
	});
};

export { uuidToBinary, saveUser, saveVerificationCode, sendVerificationEmail };
