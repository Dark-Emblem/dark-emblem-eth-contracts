const { expect } = require("chai");
const emblemHelper = require("../common/emblemHelper");

const EmblemDeck = artifacts.require("EmblemDeck");

/**
 * Test EmblemERC271 abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck ERC721", () => {
    let contract;

    before(async () => {
        contract = await EmblemDeck.deployed();
    });

    describe("deployment", () => {
        // Sanity check, not really necessary since EmblemDeck.test.js will take care
        // of this test
        it("deploys successfully", () => {
            const address = contract.address;

            // Contract address is not empty or the null address
            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });
    });

    describe("totalSupply", () => {
        it("returns totalSupply", async () => {
            const totalSupply = await contract.totalSupply();
            // Total supply always starts at 1. We burn the first card
            expect(totalSupply).to.be.bignumber.equal("1");

            await emblemHelper.mint(12, contract);

            const totalSupply2 = await contract.totalSupply();
            expect(totalSupply2).to.be.bignumber.equal("13");
        });
    });
});
