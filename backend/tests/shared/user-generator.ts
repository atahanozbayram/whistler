import { faker } from "@faker-js/faker";
import passGen from "generate-password";
import { generateUsername } from "unique-username-generator";
import _ from "lodash";

// Turns Date object into yyyy-mm-dd format string.
const formatDate = function (date: Date) {
	let day = "" + date.getDate();
	let month = "" + (date.getMonth() + 1);
	const year = "" + date.getFullYear();

	if (month.length < 2) month = "0" + month;
	if (day.length < 2) day = "0" + day;

	return [year, month, day].join("-");
};

passGen.generate({ length: 8, numbers: true, symbols: true, uppercase: true, lowercase: true });

// Generates a user with random data, could be used in testing code.
const dummyUserGenerator = function () {
	const gender = faker.name.gender(true) as "female" | "male";
	const firstname = faker.name.firstName(gender);
	const lastname = faker.name.lastName(gender);
	const email = faker.internet.email(firstname, lastname);
	const username = generateUsername("", 4, 16);
	const password = passGen.generate({
		length: _.random(8, 16, false),
		lowercase: true,
		uppercase: true,
		symbols: true,
		numbers: true,
		strict: true,
	});
	const birth_date = formatDate(faker.date.birthdate());

	const genderNumber = gender === "female" ? 1 : 2;

	return {
		firstname: firstname,
		lastname: lastname,
		username: username,
		password: password,
		email: email,
		gender: gender,
		genderNumber: genderNumber,
		birth_date: birth_date,
	};
};

export { dummyUserGenerator };
