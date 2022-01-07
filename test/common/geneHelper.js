const bs58 = require("bs58");
const BN = require("bn.js");

module.exports = {
    bs58ToBN(hash) {
        const hex = bs58.decode(hash).toString("hex");
        const n = new BN(hex, 16);

        return n;
    },
};
