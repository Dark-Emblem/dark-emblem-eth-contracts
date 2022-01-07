const { expect } = require("chai");
const web3 = require("web3");
const emblemHelper = require("../common/emblemHelper");
const { expectThrowsAsync } = require("../common/helpers");

const EmblemDeck = artifacts.require("EmblemDeck");

/**
 * Test EmblemDeck abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck Card Buying", (accounts) => {
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

    describe("buyPack", () => {
        let previousTotalSupply = 0;

        beforeEach(async () => {
            previousTotalSupply = (await contract.totalSupply()).toNumber();
        });

        it("fails if the user does not send enough ETH", async () => {
            await expectThrowsAsync(
                () => contract.buyPack({ from: accounts[0], value: 0 }),
                /revert/
            );
        });

        it("let's any user buy a pack", async () => {
            const result = await contract.buyPack({
                from: accounts[3],
                value: emblemHelper.packCost,
            });

            expect(result.logs.length).to.be.equal(3 * 2);
            expect(result.logs[0].event).to.be.equal("CardCreated");
            expect(result.logs[1].event).to.be.equal("Transfer");
            expect(result.logs[2].event).to.be.equal("CardCreated");
            expect(result.logs[3].event).to.be.equal("Transfer");
            expect(result.logs[4].event).to.be.equal("CardCreated");

            // Expect 3 cards to be created
            const totalSupply =
                (await contract.totalSupply()).toNumber() - previousTotalSupply;
            expect(totalSupply).to.be.equal(3);
        });

        it("let's the user buy cards in bulk", async () => {
            const result = await contract.buyPack({
                from: accounts[3],
                value: web3.utils.toWei("0.1", "ether"),
            });

            // 3 cards, 2 events, 5 packs
            expect(result.logs.length).to.be.equal(3 * 5 * 2);
            // Expect 3 cards to be created
            const totalSupply =
                (await contract.totalSupply()).toNumber() - previousTotalSupply;
            expect(totalSupply).to.be.equal(3 * 5);
        });
    });
});
