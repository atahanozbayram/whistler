import { saveUser, uuidToBinary } from "@shared/user";
import { transporter } from "@root/src/shared/mailer";
import { saveVerificationCode, sendVerificationEmail } from "@shared/user/verification";
import { SentMessageInfo } from "nodemailer";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { v1 as uuidv1 } from "uuid";
import { prisma } from "@shared/prisma-original";

jest.mock("@shared/mailer");

const mockedTransporter = jest.mocked(transporter, true);

type UserInfo = {
	firstname: string;
	lastname: string;
	email: string;
	gender: number;
	password: string;
	username: string;
	birth_date: Date;
};

const dummyUser = dummyUserGenerator();
const userInfoInstance: UserInfo = {
	firstname: dummyUser.firstname,
	lastname: dummyUser.lastname,
	email: dummyUser.email,
	gender: dummyUser.genderNumber,
	password: dummyUser.password,
	birth_date: new Date(dummyUser.birth_date),
	username: dummyUser.username,
};

describe("saveVerificationCode related tests", () => {
	test("verificationCode is saved when valid user uuid is given", (done) => {
		const userInfo = userInfoInstance;

		saveUser(userInfo)
			.then((user1) => {
				saveVerificationCode(user1.uuid)
					.then((code1) => {
						prisma.verification_code.findFirst({ where: { code: code1, valid: true } }).then((foundCode) => {
							expect(foundCode?.code).toBe(code1);
							done();
						});
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});

	test("verification code is not saved when invalid user uuid is given", (done) => {
		const nonSavedUuid = uuidToBinary(uuidv1());
		saveVerificationCode(nonSavedUuid)
			.then(() => {
				done("saveVerificationCode should not resolve instead it should reject.");
			})
			.catch(() => {
				done();
			});
	});
});

describe("sendVerificationEmail related tests", () => {
	test("sendVerificationEmail calls sendMail when provided with correct uuid", (done) => {
		saveUser(userInfoInstance)
			.then((user1) => {
				mockedTransporter.sendMail.mockResolvedValue({} as SentMessageInfo);

				sendVerificationEmail({ user_email: user1.email })
					.then(() => {
						expect(mockedTransporter.sendMail.mock.calls.length).not.toBe(0);
						done();
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});

	test("sendVerificationEmail calls sendMail when provided with only valid email address", (done) => {
		saveUser(userInfoInstance)
			.then((user1) => {
				mockedTransporter.sendMail.mockResolvedValue({} as SentMessageInfo);

				sendVerificationEmail({ user_email: user1.email })
					.then(() => {
						expect(mockedTransporter.sendMail.mock.calls.length).not.toBe(0);
						done();
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});
});
