import request from "supertest";
import { App } from "@src/app";
import { SignIn, signInReqBody } from "@controllers/user/sign-in";
import { saveUser } from "@shared/user";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { prisma } from "@root/src/shared/prisma-original";

const app = new App().app;

describe("", () => {
	const signIn = new SignIn();
	app.post("/sign-in", signIn.router);

	test("rejects with 400 when given invalid request parameters", (done) => {
		request(app)
			.post("/sign-in")
			.send({ completely: "irrelevant" })
			.then((response) => {
				expect(response.statusCode).toBe(400);
				done();
			});
	});

	test("sends 401 when given nonexistent username", (done) => {
		// save a user and verify it by hand
		const dummyUser = dummyUserGenerator();
		request(app)
			.post("/sign-in")
			.send({ username: dummyUser.username, password: dummyUser.password } as signInReqBody)
			.then((response) => {
				expect(response.statusCode).toBe(401);
				done();
			});
	});

	test("sends 401 when password is incorrect", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			username: dummyUser.username,
			password: dummyUser.password,
			gender: dummyUser.genderNumber,
			firstname: dummyUser.firstname,
			email: dummyUser.email,
			birth_date: new Date(dummyUser.birth_date),
			lastname: dummyUser.lastname,
		})
			.then((user1) => {
				// make the user verified manually.
				prisma.user.update({ where: { uuid: user1.uuid }, data: { verified: true } }).then(() => {
					request(app)
						.post("/sign-in")
						.send({ username: dummyUser.username, password: dummyUser.password + "fake" } as signInReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(401);
							done();
						});
				});
			})
			.catch((error) => done(error));
	});

	test("responds with status 200, cookie for refreseh_token and sends access_token as body given correct username password", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			username: dummyUser.username,
			password: dummyUser.password,
			gender: dummyUser.genderNumber,
			email: dummyUser.email,
			birth_date: new Date(dummyUser.birth_date),
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
		}).then((user1) => {
			// update the verified section of user
			prisma.user.update({ where: { uuid: user1.uuid }, data: { verified: true } }).then(() => {
				request(app)
					.post("/sign-in")
					.send({ username: dummyUser.username, password: dummyUser.password } as signInReqBody)
					.then((response) => {
						const cookies = response.headers["set-cookie"];
						expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining("refresh_token")]));
						expect(response.body).toHaveProperty("access_token");
						expect(response.statusCode).toBe(200);
						done();
					});
			});
		});
	});

	test("responds with status 200, cookie for refreseh_token and sends access_token as body given correct email password", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			username: dummyUser.username,
			password: dummyUser.password,
			gender: dummyUser.genderNumber,
			email: dummyUser.email,
			birth_date: new Date(dummyUser.birth_date),
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
		}).then((user1) => {
			// update the verified section of user
			prisma.user.update({ where: { uuid: user1.uuid }, data: { verified: true } }).then(() => {
				request(app)
					.post("/sign-in")
					.send({ email: dummyUser.email, password: dummyUser.password } as signInReqBody)
					.then((response) => {
						const cookies = response.headers["set-cookie"];
						expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining("refresh_token")]));
						expect(response.body).toHaveProperty("access_token");
						expect(response.statusCode).toBe(200);
						done();
					});
			});
		});
	});
});
