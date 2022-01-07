const { expect } = require("chai");
const emblemHelper = require("../common/emblemHelper");
const { expectThrowsAsync } = require("../common/helpers");

const EmblemDeck = artifacts.require("EmblemDeck");

contract("EmblemAuctions", (accounts) => {
    let emblemDeck;

    before(async () => {
        emblemDeck = await EmblemDeck.deployed();
    });

    afterEach(async () => {
        try {
            // Make sure to unpause the contract
            await emblemDeck.unpause();
        } catch (e) {
            // Do nothing
        }
    });

    describe("deployment", () => {
        it("deploys successfully", async () => {
            const address = emblemDeck.address;
            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });
    });

    describe("pause/unpause", () => {
        it("does not let non-owner account pause", async () => {
            await expectThrowsAsync(
                () => emblemDeck.pause({ from: accounts[1] }),
                /revert/
            );
        });

        it("lets the owner account pause", async () => {
            const tx = await emblemDeck.pause({
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("Paused");
        });

        it("does not let non-owner account unpause", async () => {
            await expectThrowsAsync(
                () => emblemDeck.unpause({ from: accounts[1] }),
                /revert/
            );
        });

        it("lets the owner account unpause", async () => {
            await emblemDeck.pause({
                from: accounts[0],
            });
            const tx = await emblemDeck.unpause({
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("Unpaused");
        });

        it("does not let a user buy a pack when paused", async () => {
            // Pause the contract
            await emblemDeck.pause({
                from: accounts[0],
            });

            // Try to create an auction
            await expectThrowsAsync(
                () =>
                    emblemDeck.buyPack({
                        from: accounts[0],
                        value: emblemHelper.packCost,
                    }),
                /paused/
            );
        });
    });

    describe("setCurrentCardsPerPack", () => {
        it("does not let non-C-level to set the current cards per pack", async () => {
            await expectThrowsAsync(
                () =>
                    emblemDeck.setCurrentCardsPerPack(5, { from: accounts[1] }),
                /revert/
            );
        });

        it("lets the CEO set the current cards per pack", async () => {
            const tx = await emblemDeck.setCurrentCardsPerPack(5, {
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("ContractKnobUpdated");
        });
    });

    describe("setMaxCardTypes", () => {
        it("does not let non-C-level to set the max number of card types", async () => {
            await expectThrowsAsync(
                () => emblemDeck.setMaxCardTypes(5, { from: accounts[1] }),
                /revert/
            );
        });

        it("lets the CEO set the max number of card types", async () => {
            const tx = await emblemDeck.setMaxCardTypes(5, {
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("ContractKnobUpdated");
        });
    });
});
