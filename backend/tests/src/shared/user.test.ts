import { v1 as uuidv1 } from "uuid";
import { uuidToBinary, saveUser } from "../../../src/shared/user";
import { prismaMock } from "@shared/prisma-mock";
import { user } from "@prisma/client";

describe("test shared user functionalities", () => {
	test("uuidToBinary returns 16 bytes of binary in hex representation", () => {
		const uuid = uuidv1();

		expect(uuidToBinary(uuid).length).toBe(16);
	});

	test("saveUser calls appropriate prisma functions when provided with correct arguments", (done) => {
		const userInfo = {
			firstname: "Atahan",
			lastname: "Ozbayram",
			email: "atahan_ozbayram@hotmail.com",
			gender: 2,
			password: "password",
			username: "atahan1006",
			birth_date: new Date(1999, 7, 20),
		};

		prismaMock.user.create.mockResolvedValue(userInfo as unknown as user);

		saveUser(userInfo)
			.then(() => {
				expect(prismaMock.user.create.mock.calls.length).toBe(1);
				done();
			})
			.catch((error) => done(error));
	});
});
