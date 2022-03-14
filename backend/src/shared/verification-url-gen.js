const bcrypt = require("bcrypt");
const { v4 } = require("uuid");

const generateVerificationUrl = function (uuid) {
	let uuid_hash_B64URL = Buffer.from(bcrypt.hashSync(uuid, 1)).toString("base64url");
	let verification_uuidB64URL = Buffer.from(v4()).toString("base64url");

	let verificationUrl = `${verification_uuidB64URL}${uuid_hash_B64URL}`;
	return verificationUrl;
};

module.exports = { generateVerificationUrl };
