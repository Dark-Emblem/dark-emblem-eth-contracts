const { expect } = require("chai");

const AscendScience = artifacts.require("AscendScience");

contract("AscendScience", () => {
    let contract;

    before(async () => {
        contract = await AscendScience.deployed();
    });

    describe("deployment", () => {
        // Sanity check, not really necessary since EmblemCore.test.js will take care
        // of this test
        it("deploys successfully", () => {
            const address = contract.address;

            // Contract address is not empty or the null address
            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });
    });

    // DEBUG ONLY - getWeightedBitMask needs to be public
    // it("returns fast weighted values", async () => {
    //     const v = await contract.getWeightedBitMask(20, 1, 1);
    //     expect(v).to.be.bignumber.equal(
    //         "13164036464747520989209863307457058533372700665789093717260533760"
    //     );

    //     const v2 = await contract.getWeightedBitMask(20, 1, 2);
    //     expect(v2).to.be.bignumber.equal(
    //         "13164036458569648337239756182902065946200587723523088394155196546"
    //     );
    // });
});
