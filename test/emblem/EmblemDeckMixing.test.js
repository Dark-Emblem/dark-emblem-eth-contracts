const { expect } = require("chai");
const web3 = require("web3");
const emblemHelper = require("../common/emblemHelper");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");

const EmblemDeck = artifacts.require("EmblemDeck");

/**
 * Test EmblemMixing abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck Mixing", (accounts) => {
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

    describe("setCurrentAscendPrice", () => {
        let oldPrice;

        before(async () => {
            oldPrice = await contract.currentAscendPrice();
        });

        after(async () => {
            try {
                await contract.setCurrentAscendPrice(oldPrice, {
                    from: accounts[0],
                });
            } catch (_) {}
        });

        it("fails if non-CEO tries to change price", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setCurrentAscendPrice(
                        web3.utils.toWei("1", "ether"),
                        { from: accounts[1] }
                    ),
                /Only the CEO can perform this action/
            );
        });

        it("fails if price is below 0", async () => {
            await expectThrowsAsync(() =>
                contract.setCurrentAscendPrice(
                    web3.utils.toWei("-1", "ether"),
                    { from: accounts[1] }
                )
            );
        });

        it("sets the new pack price", async () => {
            await expectNotThrowsAsync(
                () =>
                    contract.setCurrentAscendPrice(
                        web3.utils.toWei("1", "ether")
                    ),
                { from: accounts[0] }
            );
            const price = await contract.currentAscendPrice();
            expect(price.toString()).to.be.equal(
                web3.utils.toWei("1", "ether")
            );
        });
    });

    describe("setCurrentPackId", () => {
        it("fails if non-CEO tries to change pack id", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setCurrentPackId(1195724314, {
                        from: accounts[1],
                    }),
                /Only the CEO can perform this action/
            );
        });

        it("sets the new pack id", async () => {
            const newPackId = 1095724314;
            await expectNotThrowsAsync(() =>
                contract.setCurrentPackId(newPackId, { from: accounts[0] })
            );
            const packId = await contract.currentPackId();
            expect(packId.toString()).to.be.equal(newPackId.toString(10));
        });
    });

    describe("transmogrify", () => {
        it("lets a user transmog 3 non-character items", async () => {
            const cardIds = await emblemHelper.mint(3, contract, "1");

            const id1 = cardIds[0];
            const id2 = cardIds[1];
            const id3 = cardIds[2];

            await expectNotThrowsAsync(() =>
                contract.transmogrify(id1, id2, id3, {
                    from: accounts[0],
                    value: web3.utils.toWei("0.002", "ether"),
                })
            );
        });
    });

    describe("ascend", () => {
        it("rejects the transaction if ETH value is less that price", async () => {
            // TODO
        });

        it("rejects if the user does not own the matron card", async () => {
            // TODO
        });

        it("rejects if the user does not own the patron card", async () => {
            // TODO
        });

        it("creates a new hero card for the user", async () => {
            // Mint 2 hero cards
            const cardIds = await emblemHelper.mint(2, contract);
            const matronId = cardIds[0];
            const patronId = cardIds[1];

            // Ascend
            const result = await expectNotThrowsAsync(() =>
                contract.ascend(matronId, patronId, {
                    from: accounts[0],
                    value: web3.utils.toWei("0.01", "ether"),
                })
            );

            // Check that the new hero card was created
            expect(result.logs[0].event).to.be.equal("CardCreated");
            expect(result.logs[1].event).to.be.equal("Transfer");
        });
    });

    describe("cooldowns", () => {
        // Returns the card's cooldown after it has uses ascend()
        it("returns the cooldown after ascend()", async () => {
            // Mint 2 cards
            const cardIds = await emblemHelper.mint(2, contract);
            const matronId = cardIds[0];
            const patronId = cardIds[1];

            // Before
            const cooldownBefore = await contract.getCooldown(matronId);
            expect(cooldownBefore.toString()).to.be.equal("0");

            // Ascend
            await contract.ascend(matronId, patronId, {
                from: accounts[0],
                value: web3.utils.toWei("0.01", "ether"),
            });

            // Check that the cooldown is set
            const cooldown = await contract.getCooldown(matronId);

            expect(cooldown.toString()).to.not.be.equal("0");
        });

        it("fails to ascend if the card is on cooldown", async () => {
            // Mint 2 cards
            const cardIds = await emblemHelper.mint(2, contract);
            const matronId = cardIds[0];
            const patronId = cardIds[1];

            // Ascend
            await contract.ascend(matronId, patronId, {
                from: accounts[0],
                value: web3.utils.toWei("0.01", "ether"),
            });

            // Ascend again
            await expectThrowsAsync(
                () =>
                    contract.ascend(matronId, patronId, {
                        from: accounts[0],
                        value: web3.utils.toWei("0.01", "ether"),
                    }),
                /Card 1 is on cooldown/
            );
        });
    });
});
