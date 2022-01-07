const { expect } = require("chai");
const web3 = require("web3");
const emblemHelper = require("../common/emblemHelper");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");

const EmblemDeck = artifacts.require("./EmblemDeck.sol");

/**
 * Test EmblemDeck Auctions abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck Auctions", (accounts) => {
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

    describe("createSaleAuction", () => {
        it("fails if user does not own card", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract);
            const tokenId = tokenIds[0];
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;

            // Create auction
            await expectThrowsAsync(() =>
                contract.createSaleAuction(
                    tokenId,
                    startingPrice,
                    endingPrice,
                    duration,
                    { from: accounts[1] }
                )
            );
        });

        it("creates an auction", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract);
            const tokenId = tokenIds[0];
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;

            // Create auction
            const result = await expectNotThrowsAsync(() =>
                contract.createSaleAuction(
                    tokenId,
                    startingPrice,
                    endingPrice,
                    duration,
                    { from: accounts[0] }
                )
            );

            expect(result.logs[0].event).to.be.equal("Approval"); // Approve to Deck Contract
            expect(result.logs[1].event).to.be.equal("Approval"); // Approve to Auction
            expect(result.logs[2].event).to.be.equal("Transfer"); // Transfer to Auction

            // Can't test the auction event since its in another contract
            // expect(result.logs[3].event).to.be.equal("AuctionCreated"); // AuctionCreated
        });
    });
});
