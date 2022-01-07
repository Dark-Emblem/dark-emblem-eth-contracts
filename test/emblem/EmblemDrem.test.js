const { expect } = require("chai");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");
const emblemHelper = require("../common/emblemHelper");

const EmblemDrem = artifacts.require("EmblemDrem.sol");
const EmblemDeck = artifacts.require("./EmblemDeck.sol");

contract("EmblemDrem", (accounts) => {
    let contract;
    let emblemContract;

    before(async () => {
        contract = await EmblemDrem.deployed();
        emblemContract = await EmblemDeck.deployed();
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

        it("has a name", async () => {
            const name = await contract.name();

            // Contract name is not empty
            expect(name).to.not.be.empty;
            expect(name).to.be.equal("Dark Emblem Coin");
        });

        it("has a symbol", async () => {
            const symbol = await contract.symbol();

            // Contract symbol is not empty
            expect(symbol).to.not.be.empty;
            expect(symbol).to.be.equal("DREM");
        });
    });

    describe("token", () => {
        it("let's CFO mint a token", async () => {
            const cfo = accounts[0];
            const amount = 1;

            await contract.mint(cfo, amount, { from: cfo });

            // Check that the balance is correct
            const balance = await contract.balanceOf(cfo);
            expect(balance.toNumber()).to.be.equal(amount);
        });

        it("does not let other users mint a token", async () => {
            await expectThrowsAsync(
                () => contract.mint(accounts[1], 1, { from: accounts[1] }),
                /Only CFO can call this function/
            );
        });
    });

    describe("claim/previewClaim", () => {
        it("let's any user claim rewards", async () => {
            await expectNotThrowsAsync(() =>
                contract.claim({ from: accounts[0] })
            );
        });

        it("rewards 0 $DREM if a user has no cards", async () => {
            await expectNotThrowsAsync(() =>
                contract.claim({ from: accounts[9] })
            );

            const preview = await contract.previewClaim({
                from: accounts[9],
            });
            expect(preview.toNumber()).to.be.equal(0);

            const balance = await contract.balanceOf(accounts[9]);
            expect(balance.toNumber()).to.be.equal(0);
        });

        it("does not let user double claim rewards", async () => {
            // Set claim reward to 5 cards
            await contract.setRewardThreshold(5, {
                from: accounts[0],
            });

            await emblemHelper.mint(10, emblemContract, 0x0, accounts[2]);

            // Verify the address has 0 $DREM
            const preview = await contract.previewClaim({
                from: accounts[2],
            });
            expect(preview.toNumber()).to.be.equal(2);
            const balance = await contract.balanceOf(accounts[2]);
            expect(balance.toNumber()).to.be.equal(0);

            // Claim rewards
            await contract.claim({ from: accounts[2] });

            // Verify the address has 2 $DREM
            const preview2 = await contract.previewClaim({
                from: accounts[2],
            });
            expect(preview2.toNumber()).to.be.equal(0);
            const balance2 = await contract.balanceOf(accounts[2]);
            expect(balance2.toNumber()).to.be.equal(2);

            // Claim rewards
            await contract.claim({ from: accounts[2] });

            // Verify the address has 2 $DREM (not more)
            const preview3 = await contract.previewClaim({
                from: accounts[2],
            });
            expect(preview3.toNumber()).to.be.equal(0);
            const balance3 = await contract.balanceOf(accounts[2]);
            expect(balance3.toNumber()).to.be.equal(2);
        });
    });

    describe("buyPacks", () => {
        // TODO Hard to test since its set in deployment
        // it("errors if contract not set", async () => {
        //     await expectThrowsAsync(
        //         () =>
        //             emblemContract.buyPackWithDrem(accounts[1], {
        //                 from: accounts[1],
        //             }),
        //         /ERC20 Contract not set/
        //     );
        // });

        it("rejects if the user does not have enough $DREM", async () => {
            await expectThrowsAsync(
                () =>
                    emblemContract.buyPackWithDrem(accounts[1], 1, {
                        from: accounts[1],
                    }),
                /transfer amount exceeds balance/
            );
        });

        it("let's users exchange $DREM for a pack", async () => {
            await contract.mint(accounts[0], 1, { from: accounts[0] });

            await expectNotThrowsAsync(() =>
                emblemContract.buyPackWithDrem(accounts[0], 1, {
                    from: accounts[0],
                })
            );
        });

        it("cannot bulk buy packs if not enough funds", async () => {
            await contract.mint(accounts[0], 1, { from: accounts[0] });

            await expectThrowsAsync(
                () =>
                    emblemContract.buyPackWithDrem(accounts[0], 10, {
                        from: accounts[0],
                    }),
                /transfer amount exceeds balance/
            );
        });
    });

    describe("setNFTContract", () => {
        it("does not let non-C-level set NFT contract", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setNFTContract(emblemContract.address, {
                        from: accounts[1],
                    }),
                /Only CFO, CEO, or COO can call this function/
            );
        });

        it("does let C-level set NFT contract", async () => {
            await expectNotThrowsAsync(() =>
                contract.setNFTContract(emblemContract.address, {
                    from: accounts[0],
                })
            );
        });
    });
});
