const { expect } = require("chai");
const web3 = require("web3");
const emblemHelper = require("../common/emblemHelper");
const { expectThrowsAsync } = require("../common/helpers");

const EmblemAuctions = artifacts.require("EmblemAuctions");
const EmblemDeck = artifacts.require("EmblemDeck");

contract("EmblemAuctions", (accounts) => {
    let contract;
    let emblemDeck;

    before(async () => {
        contract = await EmblemAuctions.deployed();
        emblemDeck = await EmblemDeck.deployed();
    });

    describe("deployment", () => {
        it("deploys successfully", async () => {
            const address = contract.address;
            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });
    });

    describe("bid", () => {
        let auctionTokenId = null;

        beforeEach(async () => {
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

            auctionTokenId = tokenId;
        });

        it("should allow a successful bid", async () => {
            await contract.bid(auctionTokenId, {
                from: accounts[1],
                value: web3.utils.toWei("1.01", "ether"),
            });

            // NFT should be transferred to the bidder
            const tokenOwner = await emblemDeck.ownerOf(auctionTokenId);

            expect(tokenOwner).to.be.equal(accounts[1]);
        });

        it("should not transfer if the bid is unsuccessful", async () => {
            await expectThrowsAsync(
                () =>
                    contract.bid(auctionTokenId, {
                        from: accounts[1],
                        value: web3.utils.toWei("0.1", "ether"),
                    }),
                /Bid must be greater than/
            );

            // NFT should not be transferred to the bidder
            const tokenOwner = await emblemDeck.ownerOf(auctionTokenId);

            expect(tokenOwner).to.be.equal(contract.address);
        });
    });
});
