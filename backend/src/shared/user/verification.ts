import { Context } from "@shared/prisma-context";
import { transporter } from "@shared/mailer";
import otpGenerator from "otp-generator";
import { prisma as prismaOg } from "@shared/prisma-original";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import date from "date-and-time";
import { user_verification } from "@prisma/client";
import { v1 as uuidv1 } from "uuid";
import { uuidToBinary } from ".";

const saveVerificationCode: (user_uuid: Buffer, ctx?: Context) => Promise<user_verification> = function (
	user_uuid: Buffer,
	ctx = { prisma: prismaOg }
) {
	return new Promise((resolve, reject) => {
		ctx ??= { prisma: prismaOg } as Context;
		const { prisma } = ctx;

		// first check if the given user is existent then check if the user is not verified.
		prisma.user
			.findFirst({ where: { uuid: user_uuid } })
			.then((user1) => {
				// if user1 is null, that means it doesn't exist in database
				if (user1 === null) {
					return reject("user not found with given uuid.");
				}

				// if user's verified column is true, then we already have verified it, and furter code implementation is unnecessary.
				if (user1.verified === true) {
					return reject("user already verified.");
				}

				// we need to check if there is already an existing verification code which is still valid.
				// if it exists, resolve immediately with that existing code.
				prisma.user_verification
					.findFirst({
						where: { user_uuid: user1.uuid, valid: true, expires_at: { gt: new Date(Date.now()) } },
					})
					.then((old_valid_code) => {
						// if there is an old valid code exists, resolve with it.
						if (old_valid_code !== null) {
							resolve(old_valid_code);
							return;
						}

						// if the old_valid_code doesn't exist, then, create a new one
						const randomCode = otpGenerator.generate(6, {
							digits: true,
							specialChars: false,
							lowerCaseAlphabets: false,
							upperCaseAlphabets: false,
						});

						// save the verification code into the database
						prisma.user_verification
							.create({
								data: {
									uuid: uuidToBinary(uuidv1()),
									user_uuid: user1.uuid,
									code: randomCode,
									valid: true,
									attempts_left: 5,
									created_at: new Date(Date.now()),
									// give two hours of expiration time.
									expires_at: date.addHours(new Date(Date.now()), 2),
								},
							})
							.then((user_verification1) => {
								resolve(user_verification1);
							})
							.catch((error) => reject(error));
					})
					.catch((error) => reject(error));
			})
			.catch((error) => reject(error));
	});
};

// send the verification code to the user via email.
const sendVerificationEmail: (
	{
		user_email,
	}: {
		user_email?: string;
	},
	ctx?: Context
) => Promise<SMTPTransport.SentMessageInfo | void> = function ({ user_email }, ctx) {
	return new Promise((resolve, reject) => {
		ctx ??= { prisma: prismaOg } as Context;
		const { prisma } = ctx;

		prisma.user
			.findFirst({ where: { email: user_email, verified: false } })
			.then((user) => {
				// if the user is null, then resolve immediately.
				if (user === null) {
					resolve();
					return;
				}

				saveVerificationCode(user.uuid)
					.then((code) => {
						transporter
							.sendMail({
								sender: process.env.EMAIL_USER,
								to: user.email,
								from: "Whistler",
								subject: "Verification",
								text: `Your verification code is ${code}`,
							})
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

export { saveVerificationCode, sendVerificationEmail };
