import { describe, test } from "@jest/globals";
import { app } from "@src/app";
import request from "supertest";
import { reqVerifRoute, reqVerifReqBody } from "@controllers/user/request-verification";
import { saveUser } from "@shared/user";
import MailosaurClient from "mailosaur";
import { faker } from "@faker-js/faker";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { prisma } from "@root/src/shared/prisma-original";
import ms from "ms";

jest.setTimeout(ms("30 seconds"));

describe("request-verification related tests", () => {
	const api_key = process.env.MAILOSAUR_API_KEY as string;
	const server_id = process.env.MAILOSAUR_SERVER_ID as string;
	const server_domain = process.env.MAILOSAUR_SERVER_DOMAIN as string;

	const mailosaur = new MailosaurClient(api_key);
	app.post("/request-verification", reqVerifRoute);
	const dummyUser = dummyUserGenerator();
	dummyUser.email = faker.internet.email(dummyUser.firstname, dummyUser.lastname, server_domain);

	test("sending fully empty request body returns status code 400", (done) => {
		request(app)
			.post("/request-verification")
			.send({})
			.then((response) => {
				expect(response.statusCode).toBe(400);
				done();
			})
			.catch((error) => done(error));
	});

	test("sends verification email when given email address is in the database", (done) => {
		// mockedSendVerificationEmail.mockResolvedValue();

		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			email: dummyUser.email,
			gender: dummyUser.genderNumber,
			password: dummyUser.password,
			username: dummyUser.username,
			birth_date: new Date(dummyUser.birth_date),
		}).then((user1) => {
			request(app)
				.post("/request-verification")
				.send({ email: dummyUser.email } as reqVerifReqBody)
				.then((response) => {
					expect(response.statusCode).toBe(200);
					prisma.user_verification
						.findFirst({ where: { uuid: user1.uuid }, orderBy: { created_at: "desc" } })
						.then((verif_code) => {
							mailosaur.messages
								.get(server_id, { body: verif_code?.code, sentTo: user1.email })
								.then(() => {
									done();
								})
								.catch((error) => done(error));
						})
						.catch((error) => done(error));
				})
				.catch((error) => done(error));
		});
	});

	test("sends statusCode 400 when given email is non in the database", (done) => {
		request(app)
			.post("/request-verification")
			.send({ email: "nonexistent@example.com" } as reqVerifReqBody)
			.then((response) => {
				expect(response.statusCode).toBe(400);
				done();
			})
			.catch((error) => done(error));
	});
});
