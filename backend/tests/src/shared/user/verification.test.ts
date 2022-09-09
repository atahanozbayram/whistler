import { saveUser, uuidToBinary } from "@shared/user";
import { transporter } from "@root/src/shared/mailer";
import { saveVerificationCode, sendVerificationEmail } from "@shared/user/verification";
import { SentMessageInfo } from "nodemailer";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { v1 as uuidv1 } from "uuid";
import { prisma } from "@shared/prisma-original";
import ms from "ms";

beforeEach(() => {
	jest.useRealTimers();
	jest.useFakeTimers();
});

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
					.then((verification) => {
						prisma.user_verification
							.findFirst({ where: { code: verification.code, valid: true } })
							.then((foundCode) => {
								expect(foundCode?.code).toBe(verification.code);
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

	test("verification code will not be generated differently when a valid one already exists.", (done) => {
		const userInfo = userInfoInstance;
		saveUser(userInfo)
			.then((user1) => {
				saveVerificationCode(user1.uuid)
					.then((savedCode1) => {
						saveVerificationCode(user1.uuid)
							.then((savedCode2) => {
								expect(savedCode1.code).toBe(savedCode2.code);
								done();
							})
							.catch((error) => done(error));
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});

	test("verification code will be generated differently when old code is expired with time.", (done) => {
		const userInfo = userInfoInstance;
		saveUser(userInfo).then((user1) => {
			saveVerificationCode(user1.uuid)
				.then((verification1) => {
					jest.advanceTimersByTime(ms("3 hours"));

					saveVerificationCode(user1.uuid)
						.then((verification2) => {
							expect(verification1).not.toBe(verification2);
							done();
						})
						.catch((error) => done(error));
				})
				.catch((error) => done(error));
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
