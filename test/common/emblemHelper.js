const web3 = require("web3");

module.exports = {
    packCost: web3.utils.toWei("0.02", "ether"),

    async mint(
        numerOfCards,
        contract,
        cardType = 0x0,
        owner = "0x0000000000000000000000000000000000000000"
    ) {
        const values = [];

        for (let i = 0; i < numerOfCards; i++) {
            const numZeros = 64;
            const hexValue = i.toString(16);
            const value = hexValue.padStart(numZeros, "0");

            values.push(
                await contract.createPromoCard(
                    "0", // PackId. The mythical 0 pack
                    cardType,
                    `0x${value}`,
                    owner // Assign to COO
                )
            );
        }

        return values.map((v) => v.logs[0].args.cardId);
    },
};
