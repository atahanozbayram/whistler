import { saveUser, uuidToBinary } from "@shared/user";
import { generateAccessToken, generateRefreshToken } from "@shared/user/refresh-token";
import { dummyUserGenerator } from "@tests/shared/user-generator";
import crypto from "crypto";
import { v1 as uuidv1 } from "uuid";
import ms from "ms";
import { prisma } from "@root/src/shared/prisma-original";

beforeEach(() => {
	jest.useRealTimers();
	jest.useFakeTimers();
});

describe("generateRefreshToken tests", () => {
	test("rejects when invalid uuid is given.", (done) => {
		// create fake uuid that doesn't exist in database.
		const fake_uuid = uuidToBinary(uuidv1());

		generateRefreshToken(fake_uuid)
			.then((token) => {
				done(`should not be generated, but generated token: ${token}`);
			})
			.catch(() => done());
	});

	test("generates refresh token when given valid uuid.", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			username: dummyUser.username,
			password: dummyUser.password,
			gender: dummyUser.genderNumber,
			email: dummyUser.email,
			birth_date: new Date(dummyUser.birth_date),
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
		})
			.then((user1) => {
				generateRefreshToken(user1.uuid).then(() => {
					done();
				});
			})
			.catch((error) => done(error));
	});
});

describe("generateAccessToken tests", () => {
	test("rejects when given invalid token.", (done) => {
		const fake_rtoken_code = crypto.randomBytes(64).toString("hex");
		generateAccessToken(fake_rtoken_code)
			.then((atoken) => {
				done(`should have rejected but instead generated access token: ${atoken}`);
			})
			.catch(() => {
				done();
			});
	});

	test("rejects when refresh token is expired", (done) => {
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
			generateRefreshToken(user1.uuid).then((rtoken) => {
				jest.advanceTimersByTime(ms("16 days"));
				generateAccessToken(rtoken)
					.then((atoken) => {
						done(`should have rejected but instead generated access token: ${atoken}`);
					})
					.catch(() => {
						done();
					});
			});
		});
	});

	test("rejects when given token's validity is false", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			username: dummyUser.username,
			password: dummyUser.password,
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
			birth_date: new Date(dummyUser.birth_date),
			email: dummyUser.email,
			gender: dummyUser.genderNumber,
		}).then((user1) => {
			generateRefreshToken(user1.uuid).then((rtoken) => {
				// update the rtoken's validity
				prisma.refresh_token.updateMany({ where: { code: rtoken }, data: { validity: false } }).then(() => {
					generateAccessToken(rtoken)
						.then((atoken) => {
							done(`should have rejected but instead generated access token: ${atoken}`);
						})
						.catch(() => {
							done();
						});
				});
			});
		});
	});

	test("generates access token when given valid refresh_token", (done) => {
		const dummyUser = dummyUserGenerator();
		saveUser({
			username: dummyUser.username,
			password: dummyUser.password,
			gender: dummyUser.genderNumber,
			email: dummyUser.email,
			birth_date: new Date(dummyUser.birth_date),
			firstname: dummyUser.firstname,
			lastname: dummyUser.lastname,
		})
			.then((user1) => {
				generateRefreshToken(user1.uuid).then((rtoken) => {
					generateAccessToken(rtoken).then(() => {
						done();
					});
				});
			})
			.catch((error) => {
				done(error);
			});
	});
});
