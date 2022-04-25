const uuidToBinary = function (uuid: string) {
	const binary = Buffer.from(uuid.replaceAll("-", ""), "hex");
	return binary;
};

export { uuidToBinary };
