const { expect } = require("chai");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");

const EmblemDeck = artifacts.require("EmblemDeck");

/**
 * Test EmblemMinting abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemAccessControl", (accounts) => {
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

    describe("setCEO address", () => {
        afterEach(async () => {
            // Reset CEO address
            try {
                await contract.setCEO(accounts[0], { from: accounts[1] });
            } catch (_) {}
        });

        it("does not let a non-CEO account change the address", async () => {
            await expectThrowsAsync(() =>
                contract.setCEO(accounts[1], { from: accounts[1] })
            );
        });

        it("new address cannot be 0x00", async () => {
            await expectThrowsAsync(() =>
                contract.setCEO("0x0000000000000000000000000000000000000000", {
                    from: accounts[0],
                })
            );
        });

        it("let's CEO change address", async () => {
            await expectNotThrowsAsync(() =>
                contract.setCEO(accounts[1], { from: accounts[0] })
            );
        });
    });

    describe("setCFO address", () => {
        it("does not let a non-CEO account change the address", async () => {
            await expectThrowsAsync(() =>
                contract.setCFO(accounts[1], { from: accounts[1] })
            );
        });

        it("new address cannot be 0x00", async () => {
            await expectThrowsAsync(() =>
                contract.setCFO("0x0000000000000000000000000000000000000000", {
                    from: accounts[0],
                })
            );
        });

        it("let's CEO change address", async () => {
            await expectNotThrowsAsync(() =>
                contract.setCFO(accounts[1], { from: accounts[0] })
            );
        });
    });

    describe("setCOO address", () => {
        it("does not let a non-CEO account change the address", async () => {
            await expectThrowsAsync(() =>
                contract.setCOO(accounts[1], { from: accounts[1] })
            );
        });

        it("new address cannot be 0x00", async () => {
            await expectThrowsAsync(() =>
                contract.setCOO("0x0000000000000000000000000000000000000000", {
                    from: accounts[0],
                })
            );
        });

        it("let's CEO change address", async () => {
            await expectNotThrowsAsync(() =>
                contract.setCOO(accounts[1], { from: accounts[0] })
            );
        });
    });
});
