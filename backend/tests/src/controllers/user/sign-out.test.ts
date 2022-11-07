import { App } from "@src/app";
import { SignOut, signOutReqBody } from "@controllers/user/sign-out";
import request from "supertest";
import crypto from "crypto";
import { saveUser } from "@shared/user";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { generateRefreshToken } from "@root/src/shared/user/refresh-token";
import { prisma } from "@root/src/shared/prisma-original";

const app = new App().app;
const signOut = new SignOut();
app.post("/sign-out", signOut.router);

describe("", () => {
	test("rejects with 400 when given invalid parameters", (done) => {
		request(app)
			.post("/sign-out")
			.send({ nonsense: "invalid parameter" })
			.then((response) => {
				expect(response.statusCode).toBe(400);
				done();
			});
	});

	test("rejects when given invalid refresh_token with 401", (done) => {
		const random_token = crypto.randomBytes(64).toString("hex");
		request(app)
			.post("/sign-out")
			.send({ refresh_token: random_token, all_devices: false } as signOutReqBody)
			.then((response) => {
				expect(response.statusCode).toBe(401);
				done();
			});
	});

	test("invalidates given refresh token when provided with valid refresh_token and responds with 200 status code", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			gender: dummyUser.genderNumber,
			birth_date: new Date(dummyUser.birth_date),
			email: dummyUser.email,
			username: dummyUser.username,
			password: dummyUser.password,
		})
			.then((user1) => {
				generateRefreshToken(user1.uuid).then((rtoken) => {
					request(app)
						.post("/sign-out")
						.send({ refresh_token: rtoken.code } as signOutReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(200);
							prisma.refresh_token.findFirst({ where: { code: rtoken.code } }).then((rtoken1) => {
								if (rtoken1 === null) {
									done("no token found");
									return;
								}
								expect(rtoken1.validity).toBeFalsy();
								done();
							});
						});
				});
			})
			.catch((error) => done(error));
	});

	test("invalidates all the tokens when provided with valid refresh_token and responds with 200 status code", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			gender: dummyUser.genderNumber,
			birth_date: new Date(dummyUser.birth_date),
			email: dummyUser.email,
			username: dummyUser.username,
			password: dummyUser.password,
		}).then((user1) => {
			generateRefreshToken(user1.uuid).then((rtoken1) => {
				generateRefreshToken(user1.uuid).then((rtoken2) => {
					request(app)
						.post("/sign-out")
						.send({ refresh_token: rtoken1.code, all_devices: true } as signOutReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(200);
							prisma.refresh_token
								.findMany({ where: { uuid: { in: [rtoken1.uuid, rtoken2.uuid] } } })
								.then((rtoken_arr) => {
									expect(rtoken_arr[0].validity).toBeFalsy();
									expect(rtoken_arr[1].validity).toBeFalsy();
									done();
								});
						});
				});
			});
		});
	});

	test("invalidates only the given token and other tokens stay valid", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			gender: dummyUser.genderNumber,
			birth_date: new Date(dummyUser.birth_date),
			email: dummyUser.email,
			username: dummyUser.username,
			password: dummyUser.password,
		}).then((user1) => {
			generateRefreshToken(user1.uuid).then((rtoken1) => {
				generateRefreshToken(user1.uuid).then((rtoken2) => {
					request(app)
						.post("/sign-out")
						.send({ refresh_token: rtoken1.code } as signOutReqBody)
						.then((response) => {
							expect(response.statusCode).toBe(200);
							prisma.refresh_token.findFirst({ where: { uuid: rtoken1.uuid } }).then((rtoken1) => {
								if (rtoken1 === null) {
									done("invalid token");
									return;
								}

								expect(rtoken1.validity).toBeFalsy();
								prisma.refresh_token.findFirst({ where: { uuid: rtoken2.uuid } }).then((rtoken2) => {
									if (rtoken2 === null) {
										done("invalid token");
										return;
									}

									expect(rtoken2.validity).toBeTruthy();
									done();
								});
							});
						});
				});
			});
		});
	});
});
