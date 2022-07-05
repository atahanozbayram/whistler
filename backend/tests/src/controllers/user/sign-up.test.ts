import { describe, test } from "@jest/globals";
import { prisma } from "@shared/prisma-original";
import request from "supertest";
import { app } from "@src/app";
import { signUpRoute } from "@controllers/user/sign-up";

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
});
