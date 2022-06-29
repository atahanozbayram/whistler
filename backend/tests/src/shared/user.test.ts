import { MockContext, Context, createMockContext } from "@shared/prisma-context";
import { v1 as uuidv1 } from "uuid";
import { uuidToBinary, saveUser, saveVerificationCode, sendVerificationEmail } from "@shared/user";
import { user } from "@prisma/client";
import { prisma } from "@shared/prisma-original";
import { transporter } from "@shared/mailer";
import { SentMessageInfo } from "nodemailer";

jest.mock("@shared/mailer");

const mockedTransporter = jest.mocked(transporter, true);

let mockCtx: MockContext;
let ctx: Context;

beforeEach(() => {
	mockCtx = createMockContext();
	ctx = mockCtx as unknown as Context;
});

describe("test shared user functionalities", () => {
	test("uuidToBinary returns 16 bytes of binary in hex representation", () => {
		const uuid = uuidv1();

		expect(uuidToBinary(uuid).length).toBe(16);
	});

	test("saveUser calls appropriate prisma functions when provided with correct arguments", (done) => {
		const userInfo = {
			firstname: "Atahan",
			lastname: "Ozbayram",
			email: "atahan_ozbayram@hotmail.com",
			gender: 2,
			password: "password",
			username: "atahan1006",
			birth_date: new Date(1999, 7, 20),
		};

		mockCtx.prisma.user.create.mockResolvedValue(userInfo as unknown as user);

		saveUser(userInfo, ctx)
			.then(() => {
				expect(mockCtx.prisma.user.create.mock.calls.length).toBe(1);
				done();
			})
			.catch((error) => done(error));
	});

	test("verificationCode is saved when valid user uuid is given", (done) => {
		const userInfo = {
			firstname: "Atahan",
			lastname: "Ozbayram",
			username: "username1",
			birth_date: new Date(1999, 7, 20),
			gender: 2,
			email: "atahan_ozbayram@hotmail.com",
			password: "Password1!",
		};

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

	test("sendVerificationEmail calls sendMail when provided with correct uuid", (done) => {
		saveUser({
			firstname: "Atahan",
			lastname: "Ozbayram",
			email: "atahan_ozbayram@hotmail.com",
			gender: 2,
			password: "Password1!",
			username: "username1",
			birth_date: new Date(1999, 7, 20),
		})
			.then((user1) => {
				mockedTransporter.sendMail.mockResolvedValue({} as SentMessageInfo);

				sendVerificationEmail({ user_email: user1.email, user_uuid: user1.uuid })
					.then(() => {
						expect(mockedTransporter.sendMail.mock.calls.length).not.toBe(0);
						done();
					})
					.catch((error) => done(error));
			})
			.catch((error) => done(error));
	});

	test("sendVerificationEmail calls sendMail when provided with only valid email address", (done) => {
		saveUser({
			firstname: "Atahan",
			lastname: "Ozbayram",
			email: "atahan_ozbayram@hotmail.com",
			gender: 2,
			password: "Passord1!",
			username: "username1",
			birth_date: new Date(1999, 7, 20),
		})
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
