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

    afterEach(async () => {
        try {
            // Make sure to unpause the contract
            await contract.unpause();
        } catch (e) {
            // Do nothing
        }
    });

    describe("deployment", () => {
        it("deploys successfully", async () => {
            const address = contract.address;
            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });
    });

    describe("pause/unpause", () => {
        it("does not let non-owner account pause", async () => {
            await expectThrowsAsync(
                () => contract.pause({ from: accounts[1] }),
                /revert/
            );
        });

        it("lets the owner account pause", async () => {
            const tx = await contract.pause({
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("Paused");
        });

        it("does not let non-owner account unpause", async () => {
            await expectThrowsAsync(
                () => contract.unpause({ from: accounts[1] }),
                /revert/
            );
        });

        it("lets the owner account unpause", async () => {
            await contract.pause({
                from: accounts[0],
            });
            const tx = await contract.unpause({
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("Unpaused");
        });

        it("does not let a user create an auction when paused", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, emblemDeck);
            const tokenId = tokenIds[0];
            const startingPrice = web3.utils.toWei("1", "ether");
            const endingPrice = web3.utils.toWei("2", "ether");
            const duration = 1000;

            // Pause the contract
            await contract.pause({
                from: accounts[0],
            });

            // Try to create an auction
            await expectThrowsAsync(
                () =>
                    emblemDeck.createSaleAuction(
                        tokenId,
                        startingPrice,
                        endingPrice,
                        duration,
                        { from: accounts[0] }
                    ),
                /paused/
            );
        });

        it("does not allow a user bid on auction when paused", async () => {
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

            const auctionTokenId = tokenId;

            // Pause the contract
            await contract.pause({
                from: accounts[0],
            });

            // Try to bid
            await expectThrowsAsync(
                () =>
                    contract.bid(auctionTokenId, {
                        from: accounts[1],
                        value: web3.utils.toWei("1.01", "ether"),
                    }),
                /paused/
            );
        });

        it("does not allow a user bid on auction when paused", async () => {
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

            const auctionTokenId = tokenId;

            // Pause the contract
            await contract.pause({
                from: accounts[0],
            });

            // Try to bid
            await expectThrowsAsync(
                () =>
                    contract.cancelAuction(auctionTokenId, {
                        from: accounts[0],
                    }),
                /paused/
            );
        });
    });

    describe("setNFTContract", () => {
        it("does not let non-C-level set the nft contract", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setNFTContract(emblemDeck.address, {
                        from: accounts[1],
                    }),
                /revert/
            );
        });

        it("does let the C-level address set the nft contract", async () => {
            await contract.setNFTContract(emblemDeck.address, {
                from: accounts[0],
            });
        });
    });

    describe("setOwnerCut", () => {
        it("does not let non-C-level set the owner cut", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setOwnerCut(1000, {
                        from: accounts[1],
                    }),
                /revert/
            );
        });

        it("does let the C-level address set the onwer cut", async () => {
            const tx = await contract.setOwnerCut(1000, {
                from: accounts[0],
            });
            expect(tx.logs[0].event).to.be.equal("ContractKnobUpdated");
        });

        it("does throws if the owner cut is over 100 percent", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setOwnerCut(100000, {
                        from: accounts[0],
                    }),
                /revert/
            );
        });
    });
});
