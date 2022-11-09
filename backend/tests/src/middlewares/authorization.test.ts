import { authorizationMw } from "@middlewares/authorization.mw";
import { App } from "@src/app";
import { Request, Response } from "express";
import request from "supertest";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import { saveUser } from "@shared/user";
import { generateAccessToken, generateRefreshToken } from "@shared/user/refresh-token";
import ms from "ms";

beforeEach(() => {
	jest.useRealTimers();
	jest.useFakeTimers();
});

const app = new App().app;

const simpleController = function(req: Request, res: Response) {
	res.status(200).json({ message: "all good" });
};

app.post("/", authorizationMw, simpleController);

test("sends 401 when no authorization token provided", (done) => {
	request(app)
		.post("/")
		.set("Authorization", `Bearer dul`)
		.send({})
		.then((response) => {
			expect(response.statusCode).toBe(401);
			done();
		});
});

test("sends 200 when valid access token is present", (done) => {
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
		generateRefreshToken(user1.uuid).then((rtoken) => {
			generateAccessToken(rtoken.code).then((atoken) => {
				request(app)
					.post("/")
					.set("Authorization", `Bearer ${atoken}`)
					.send({})
					.then((response) => {
						expect(response.statusCode).toBe(200);
						done();
					});
			});
		});
	});
});

test("sends 401 when access token is expired by time", (done) => {
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
		generateRefreshToken(user1.uuid).then((rtoken) => {
			generateAccessToken(rtoken.code, "3m").then((atoken) => {
				// advance time by 5 minutes when access_token has 3 minutes to expire.
				jest.advanceTimersByTime(ms("3m"));
				request(app)
					.post("/")
					.set("Authorization", `Bearer ${atoken}`)
					.send({})
					.then((response) => {
						expect(response.statusCode).toBe(401);
						done();
					});
			});
		});
	});
});
