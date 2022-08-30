import { Context } from "@shared/prisma-context";
import { transporter } from "@shared/mailer";
import otpGenerator from "otp-generator";
import { prisma as prismaOg } from "@shared/prisma-original";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { uuidToBinary } from "@shared/user";
import { v1 as uuidv1 } from "uuid";

const saveVerificationCode: (user_uuid: Buffer, ctx?: Context) => Promise<string> = function (
	user_uuid: Buffer,
	ctx = { prisma: prismaOg }
) {
	return new Promise((resolve, reject) => {
		ctx ??= { prisma: prismaOg } as Context;
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
