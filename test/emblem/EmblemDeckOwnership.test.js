const { expect } = require("chai");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");
const emblemHelper = require("../common/emblemHelper");

const EmblemDeck = artifacts.require("EmblemDeck");
const EmblemAuctions = artifacts.require("EmblemAuctions");

/**
 * Test EmblemDeck Ownership abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck Ownership", (accounts) => {
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

    describe("transfer", () => {
        it("fails if address is to 0 address", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract, 0x0);
            const tokenId = tokenIds[0];
            await expectThrowsAsync(
                () =>
                    contract.transfer(
                        "0x0000000000000000000000000000000000000000",
                        tokenId
                    ),
                /Cannot transfer to 0x0/
            );
        });

        it("fails if address is to contract address", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract, 0x0);
            const tokenId = tokenIds[0];
            await expectThrowsAsync(
                () => contract.transfer(contract.address, tokenId),
                /Cannot transfer to contract itself/
            );
        });

        it("fails if address is to the auction address", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract, 0x0);
            const tokenId = tokenIds[0];
            await expectThrowsAsync(
                () => contract.transfer(auctions.address, tokenId),
                /Cannot transfer to the sale auction/
            );
        });

        it("fails if address does not own the token", async () => {
            // Mint a token
            await emblemHelper.mint(1, contract, 0x0);
            const tokenId = (await contract.totalSupply()).toNumber() - 1;
            await expectThrowsAsync(
                () =>
                    contract.transfer(accounts[2], tokenId, {
                        from: accounts[1],
                    }),
                /revert/
            );
        });

        it("allows a user to transfer their own card to a new address", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract, 0x0);
            const tokenId = tokenIds[0];
            const result = await expectNotThrowsAsync(() =>
                contract.transfer(accounts[1], tokenId)
            );

            // Expect a transfer event in the logs
            expect(result.logs[0].event).to.be.equal("Approval");
            expect(result.logs[1].event).to.be.equal("Transfer");
        });
    });

    describe("approve", () => {
        it("does not let a non-owner approve the token for transfer", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract, 0x0);
            const tokenId = tokenIds[0];
            return expectThrowsAsync(
                () =>
                    contract.approve(accounts[1], tokenId, {
                        from: accounts[2],
                    }),
                /revert/
            );
        });

        it("let's a user approve a token for transfer", async () => {
            // Mint a token
            const tokenIds = await emblemHelper.mint(1, contract, 0x0);
            const tokenId = tokenIds[0];
            // Approve the token
            const result = await expectNotThrowsAsync(() =>
                contract.approve(accounts[1], tokenId)
            );

            // Expect an approval event in the logs
            expect(result.logs[0].event).to.be.equal("Approval");
        });
    });
});
