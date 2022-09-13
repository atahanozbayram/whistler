import { App } from "@src/app";
import { saveUser } from "@root/src/shared/user";
import { saveVerificationCode } from "@shared/user/verification";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { verifAccReqBody, verifAccRoute } from "@controllers/user/verify-account";
import request from "supertest";
import ms from "ms";

const app = new App().app;

describe("verify-account related tests", () => {
	beforeEach(() => {
		jest.useRealTimers();
		jest.useFakeTimers();
	});

	app.post("/verify-account", verifAccRoute);

	test("sending fully empty request body returns 400 status code.", (done) => {
		request(app)
			.post("/verify-account")
			.send({})
			.then((response) => {
				expect(response.statusCode).toBe(400);
				done();
			})
			.catch((error) => done(error));
	});

	test("with valid verification attempt, you will receive status code 200", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			email: dummyUser.email,
			gender: dummyUser.genderNumber,
			password: dummyUser.password,
			username: dummyUser.username,
			birth_date: new Date(dummyUser.birth_date),
		})
			.then((user1) => {
				saveVerificationCode(user1.uuid).then((verification) => {
					request(app)
						.post("/verify-account")
						.send({ email: user1.email, verification_code: verification.code } as verifAccReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(200);
							done();
						});
				});
			})
			.catch((error) => done(error));
	});

	test("with invalid verification attempt you will receive status code 400", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			email: dummyUser.email,
			gender: dummyUser.genderNumber,
			password: dummyUser.password,
			username: dummyUser.username,
			birth_date: new Date(dummyUser.birth_date),
		})
			.then((user1) => {
				saveVerificationCode(user1.uuid).then((verification) => {
					const invalidCode = (Number.parseInt(verification.code) + 1).toString();
					request(app)
						.post("/verify-account")
						.send({ email: user1.email, verification_code: invalidCode } as verifAccReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(400);
							done();
						});
				});
			})
			.catch((error) => done(error));
	});

	test("after 5 invalid attempts, entering the right verification code will also result int status code 400", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			email: dummyUser.email,
			gender: dummyUser.genderNumber,
			username: dummyUser.username,
			password: dummyUser.password,
			birth_date: new Date(dummyUser.birth_date),
		})
			.then((user1) => {
				saveVerificationCode(user1.uuid).then((verification) => {
					const invalidCode = (Number.parseInt(verification.code) + 1).toString();

					const requestPromise = function (code: string) {
						return new Promise<request.Response>((resolve) => {
							request(app)
								.post("/verify-account")
								.send({ email: user1.email, verification_code: code } as verifAccReqBody)
								.then((response) => {
									resolve(response);
								});
						});
					};

					const promiseArray: Promise<request.Response>[] = [];
					for (let i = 0; i < 5; ++i) {
						promiseArray.push(requestPromise(invalidCode));
					}

					Promise.all(promiseArray).then(() => {
						requestPromise(verification.code).then((response) => {
							expect(response.statusCode).toBe(400);
							done();
						});
					});
				});
			})
			.catch((error) => done(error));
	});

	test("after the token expires by time, user will receive status code 400 even though entered a valid code", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			email: dummyUser.email,
			gender: dummyUser.genderNumber,
			username: dummyUser.username,
			password: dummyUser.password,
			birth_date: new Date(dummyUser.birth_date),
		})
			.then((user1) => {
				saveVerificationCode(user1.uuid).then((verification) => {
					jest.advanceTimersByTime(ms("3 hours"));

					request(app)
						.post("/verify-account")
						.send({ email: user1.email, verification_code: verification.code } as verifAccReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(400);
							done();
						});
				});
			})
			.catch((error) => done(error));
	});
});
