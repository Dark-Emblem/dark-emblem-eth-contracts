const { expect } = require("chai");
const web3 = require("web3");
const emblemHelper = require("../common/emblemHelper");
const {
    expectNotThrowsAsync,
    expectThrowsAsync,
} = require("../common/helpers");
const EmblemAuctions = artifacts.require("EmblemAuctions");
const EmblemDeck = artifacts.require("EmblemDeck");

contract("EmblemAuctions Base", (accounts) => {
    let contract;
    let emblemDeck;

    before(async () => {
        contract = await EmblemAuctions.deployed();
        emblemDeck = await EmblemDeck.deployed();
    });

    describe("deployment", () => {
        it("deploys successfully", () => {
            const address = contract.address;

            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });
    });

    describe("getAuctions", () => {
        it("returns 0 auction ids when first deployed", async () => {
            const auctions = await contract.getAuctions();

            expect(auctions).to.be.empty;
        });

        it("returns all auction ids", async () => {
            // We need to create a few auctions

            // Mint a token
            const tokenIds = await emblemHelper.mint(1, emblemDeck);
            const tokenId = tokenIds[0];
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;

            // Create auction
            await emblemDeck.createSaleAuction(
                tokenId,
                startingPrice,
                endingPrice,
                duration,
                { from: accounts[0] }
            );

            const auctions = await contract.getAuctions();

            expect(auctions).to.not.be.empty;
            expect(auctions).to.have.lengthOf(1);
        });
    });

    describe("getAuction", () => {
        it("returns an auction if it exists", async () => {
            // Create a card
            const tokenIds = await emblemHelper.mint(1, emblemDeck);

            const tokenId = tokenIds[0];

            // Create an auction
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;
            await expectNotThrowsAsync(() =>
                emblemDeck.createSaleAuction(
                    tokenId,
                    startingPrice,
                    endingPrice,
                    duration,
                    { from: accounts[0] }
                )
            );

            // Get the auciton by the token Id
            const auction = await contract.getAuction(tokenId);
            expect(auction).to.not.be.empty;
            expect(auction).to.not.be.equal(0x0);
            expect(auction.seller).to.be.equal(accounts[0]);
            expect(auction.duration.toString()).to.be.equal(
                duration.toString()
            );
        });

        it("throws if the auction does not exist", async () => {
            await expectThrowsAsync(
                () => contract.getAuction(1002001010),
                /Auction is not live/
            );
        });
    });

    describe("cancelAuction", () => {
        it("throws if the caller is not the seller", async () => {
            // Create a card
            const tokenIds = await emblemHelper.mint(1, emblemDeck);

            const tokenId = tokenIds[0];

            // Create an auction
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;
            await expectNotThrowsAsync(() =>
                emblemDeck.createSaleAuction(
                    tokenId,
                    startingPrice,
                    endingPrice,
                    duration,
                    { from: accounts[0] }
                )
            );

            // Cancel the auction
            await expectThrowsAsync(
                () => contract.cancelAuction(tokenId, { from: accounts[1] }),
                /Only the seller can cancel an auction/
            );
        });

        it("throws if the auction is not on", async () => {
            // Create a card
            const tokenIds = await emblemHelper.mint(1, emblemDeck);

            const tokenId = tokenIds[0];

            // Cancel the auction
            await expectThrowsAsync(
                () => contract.cancelAuction(tokenId, { from: accounts[0] }),
                /Auction is not live/
            );
        });

        it("transfers and emits and event on success", async () => {
            // Create a card
            const tokenIds = await emblemHelper.mint(1, emblemDeck);
            const tokenId = tokenIds[0];

            // Create an auction
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;
            await expectNotThrowsAsync(() =>
                emblemDeck.createSaleAuction(
                    tokenId,
                    startingPrice,
                    endingPrice,
                    duration,
                    { from: accounts[0] }
                )
            );

            // Cancel the auction
            const result = await expectNotThrowsAsync(() =>
                contract.cancelAuction(tokenId, { from: accounts[0] })
            );

            // Check the event
            const event = result.logs[0];
            expect(event.event).to.be.equal("AuctionCancelled");
            expect(event.args.tokenId.toString()).to.be.equal(
                tokenId.toString()
            );

            // Check the owner of the token
            const owner = await emblemDeck.ownerOf(tokenId);
            expect(owner).to.be.equal(accounts[0]);
        });
    });
});
