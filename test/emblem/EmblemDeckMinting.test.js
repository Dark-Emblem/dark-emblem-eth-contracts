const { expect } = require("chai");
const emblemHelper = require("../common/emblemHelper");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");

const EmblemDeck = artifacts.require("EmblemDeck");
const EmblemAuctions = artifacts.require("EmblemAuctions");

/**
 * Test EmblemMinting abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck Minting", (accounts) => {
    let contract;
    let auctions;

    before(async () => {
        contract = await EmblemDeck.deployed();
        auctions = await EmblemAuctions.deployed();
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

    describe("setCurrentPackPrice", () => {
        afterEach(async () => {
            // reset current pack price
            await contract.setCurrentPackPrice(emblemHelper.packCost, {
                from: accounts[0],
            });
        });

        it("fails if the user is not the COO", async () => {
            await expectThrowsAsync(
                () => contract.setCurrentPackPrice(10, { from: accounts[1] }),
                /Only CFO, CEO, or COO can call this function/
            );
        });

        it("fails if the price is negative", async () => {
            await expectThrowsAsync(() =>
                contract.setCurrentPackPrice(-1, { from: accounts[0] })
            );
        });

        it("succeeds if the price is positive and the user is the COO", async () => {
            await expectNotThrowsAsync(() =>
                contract.setCurrentPackPrice(10, { from: accounts[0] })
            );

            const newValue = await contract.currentPackPrice();
            expect(newValue.toString()).to.be.equal("10");
        });
    });

    describe("createPromoCard", () => {
        it("should create a new card", async () => {
            const result = await contract.createPromoCard(
                "0",
                "0x00",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000000" // Assign to COO
            );

            const birthEvent = result.logs[0];
            const transferEvent = result.logs[1];

            expect(birthEvent.event).to.be.equal("CardCreated");
            expect(birthEvent.args.cardId).to.be.bignumber.equal("1");
            expect(birthEvent.args.matronId).to.be.bignumber.equal("0");
            expect(birthEvent.args.sireId).to.be.bignumber.equal("0");
            expect(birthEvent.args.traits).to.be.bignumber.equal("1");

            expect(transferEvent.event).to.be.equal("Transfer");
            expect(transferEvent.args.from).to.be.equal(
                "0x0000000000000000000000000000000000000000"
            );
            expect(transferEvent.args.to).to.be.equal(accounts[0]);
            expect(transferEvent.args.tokenId).to.be.bignumber.equal("1");
        });

        it("should create another new card", async () => {
            const result = await contract.createPromoCard(
                "0",
                "0x00",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                "0x0000000000000000000000000000000000000000" // Assign to COO
            );

            const birthEvent = result.logs[0];
            const transferEvent = result.logs[1];

            expect(birthEvent.event).to.be.equal("CardCreated");
            expect(birthEvent.args.cardId).to.be.bignumber.equal("2");
            expect(birthEvent.args.matronId).to.be.bignumber.equal("0");
            expect(birthEvent.args.sireId).to.be.bignumber.equal("0");
            expect(birthEvent.args.traits).to.be.bignumber.equal("1");

            expect(transferEvent.event).to.be.equal("Transfer");
            expect(transferEvent.args.from).to.be.equal(
                "0x0000000000000000000000000000000000000000"
            );
            expect(transferEvent.args.to).to.be.equal(accounts[0]);
            expect(transferEvent.args.tokenId).to.be.bignumber.equal("2");
        });

        it("does not allow the same card to be generated", async () => {
            const traits =
                "0x0000000000000000000000000000000000000000000000000000000000000010";

            await contract.createPromoCard(
                "0",
                "0x00",
                traits,
                "0x0000000000000000000000000000000000000000" // Assign to COO
            );

            await expectThrowsAsync(() =>
                contract.createPromoCard(
                    traits,
                    "0x0000000000000000000000000000000000000000" // Assign to COO
                )
            );
        });

        it("non-COO can't create card", async () => {
            await expectThrowsAsync(() =>
                contract.createPromoCard(
                    "0x00",
                    "0x0000000000000000000000000000000000000000000000000000000000000001",
                    "0x0000000000000000000000000000000000000000", // Assign to COO
                    { from: accounts[1] } // Not the COO
                )
            );
        });
    });

    describe("createPromoAuction", () => {
        it("fails if the user is not COO", async () => {
            await expectThrowsAsync(
                () =>
                    contract.createPromoAuction(
                        "0x00",
                        "0x0000000000000000000000000000000000000000000000000000000000000001",
                        { from: accounts[1] }
                    ),
                /Only COO can call this function/
            );
        });

        // NOTE can't really test since the contract is set on migration
        // it('it fails if sale contract is not set', async () => {
        //     await expectThrowsAsync(
        //         () => contract.createPromoAuction(
        //             '0x00',
        //             '0x0000000000000000000000000000000000000000000000000000000000000001',
        //             { from: accounts[0] }
        //         ),
        //         /revert/
        //     );
        // });

        // it creates a new card, and auction
        it("creates a new card and auction", async () => {
            // Set the sale contract
            await contract.setSaleAuctionAddress(auctions.address);
            const result = await contract.createPromoAuction(
                "0x00",
                "0x0000000000000000000000000000000000000000000000000000000000000001",
                { from: accounts[0] }
            );

            expect(result.logs.length).to.be.equal(5);
            expect(result.logs[0].event).to.be.equal("CardCreated");
            expect(result.logs[1].event).to.be.equal("Transfer"); // mint
            expect(result.logs[2].event).to.be.equal("Approval"); // escrow
            expect(result.logs[3].event).to.be.equal("Approval"); // escrow
            expect(result.logs[4].event).to.be.equal("Transfer"); // escrow

            // NOTE how do we test this missing event?
            // There is a seperate AuctionCreated event that doesn't show up...
        });
    });

    describe("pack limits", () => {
        it("let's C-level set a pack limit", async () => {
            await contract.setSeasonPackLimit(10);
            const packLimit = await contract.seasonPackLimit();

            expect(packLimit).to.be.bignumber.equal("10");
        });

        it("does not let a non-C-level set a pack limit", async () => {
            await expectThrowsAsync(
                () => contract.setSeasonPackLimit(10, { from: accounts[1] }),
                /Reason given: Only CFO, CEO, or COO can call this function./
            );
        });

        it("enforces a pack limit", async () => {
            await contract.setSeasonPackLimit(0);

            await expectThrowsAsync(
                () =>
                    contract.buyPack({
                        from: accounts[0],
                        value: emblemHelper.packCost,
                    }),
                /Cannot mint any more packs this season/
            );
        });

        it("resets the pack limit when packId is updates", async () => {
            await contract.setSeasonPackLimit(10);
            await contract.buyPack({
                from: accounts[0],
                value: emblemHelper.packCost,
            });

            const packsMintedMinted = await contract.seasonPacksMinted();

            expect(packsMintedMinted).to.be.bignumber.gt("0");

            await contract.setCurrentPackId(1095724314, { from: accounts[0] });

            const packsMintedAfter = await contract.seasonPacksMinted();
            expect(packsMintedAfter).to.be.bignumber.equal("0");
        });
    });
});
