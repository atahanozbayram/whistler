import { app } from "@src/app";
import { saveUser } from "@root/src/shared/user";
import { saveVerificationCode } from "@shared/user/verification";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { verifAccReqBody, verifAccRoute } from "@controllers/user/verify-account";
import request from "supertest";

describe("verify-account related tests", () => {
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
});
