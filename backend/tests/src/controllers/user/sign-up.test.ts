import { describe, test } from "@jest/globals";
import { prisma } from "@shared/prisma-original";
import request from "supertest";
import { app } from "@src/app";
import { signUpRoute } from "@controllers/user/sign-up";

beforeAll((done) => {
	if (/test$/i.test(process.env["DATABASE_URL"] as string))
		prisma.user
			.deleteMany({ where: {} })
			.then(() => {
				done();
			})
			.catch((error) => done(error));
});

describe("sign-up related tests", () => {
	app.post("/sign-up", signUpRoute);
	test("sending fully empty request body causes errors to be returned.", (done) => {
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
