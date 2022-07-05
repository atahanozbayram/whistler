import { describe, test } from "@jest/globals";
import { prisma } from "@shared/prisma-original";
import request from "supertest";
import { app } from "@src/app";
import { signUpRoute, signUpReqBody } from "@controllers/user/sign-up";

describe("sign-up related tests", () => {
	app.post("/sign-up", signUpRoute);
	test("sending fully empty request body returns 400 status code.", (done) => {
		request(app)
			.post("/sign-up")
			.send({})
			.then((response) => {
				expect(response.statusCode).toBe(400);
				done();
			})
			.catch((error) => done(error));
	});

	test("sending fully correct request body returns 200 status code.", (done) => {
		request(app)
			.post("/sign-up")
			.send({
				firstname: "Atahan",
				lastname: "Ozbayram",
				gender: 2,
				password: "Password1!",
				password_confirmation: "Password1!",
				username: "username1",
				birth_date: "1999-07-20",
				email: "atahan_ozbayram@hotmail.com",
			} as signUpReqBody)
			.then((response) => {
				console.log("response body: %o", response.body);
				expect(response.statusCode).toBe(200);
				done();
			})
			.catch((error) => done(error));
	});
});
