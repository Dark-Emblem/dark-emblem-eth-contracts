const { expect } = require("chai");
const emblemHelper = require("../common/emblemHelper");

const EmblemDeck = artifacts.require("EmblemDeck");

/**
 * Test EmblemDeck abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck Base", (accounts) => {
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

    describe("getCardsByOwner", () => {
        it("returns an empty array", async () => {
            const tokenIds = await contract.getCardsByOwner(accounts[2]);

            expect(tokenIds).to.be.empty;
        });

        it("returns the token id after minting", async () => {
            const ids = await emblemHelper.mint(1, contract);

            const tokenIds = await contract.getCardsByOwner(accounts[0]);

            expect(tokenIds.map((b) => b.toString())).to.contain(
                ids[0].toString()
            );
        });
    });
});
