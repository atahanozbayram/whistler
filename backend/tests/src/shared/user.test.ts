import { v1 as uuidv1 } from "uuid";
import { uuidToBinary } from "@shared/user";

describe("test shared user functionalities", () => {
	test("uuidToBinary returns 16 bytes of binary in hex representation", () => {
		const uuid = uuidv1();

		expect(uuidToBinary(uuid).length).toBe(16);
	});
});
