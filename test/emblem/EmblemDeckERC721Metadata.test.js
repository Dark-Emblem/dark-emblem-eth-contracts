const { expect } = require("chai");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");
const emblemHelper = require("../common/emblemHelper");

const EmblemDeck = artifacts.require("EmblemDeck");

/**
 * Test EmblemERC271 abstract contract by deploying the EmblemDeck contract
 */
contract("EmblemDeck ERC271Metadata", (accounts) => {
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

    describe("tokenURI", () => {
        it("Fails if the token does not exist", async () => {
            await expectThrowsAsync(
                () => contract.tokenURI(1),
                /URI query for nonexistent token/
            );
        });

        it("returns the tokenURI for the given tokenId", async () => {
            // Mint 1 token
            await emblemHelper.mint(1, contract);

            const tokenURI = await contract.tokenURI(1);

            expect(tokenURI).to.be.equal("https://api.darkemblem.com/cards/1");
        });
    });

    describe("baseURI", () => {
        it("returns the baseURI", async () => {
            const baseURI = await contract.baseURI();

            expect(baseURI).to.be.equal("https://api.darkemblem.com/cards/");
        });

        it("does not let user change baseURI", async () => {
            await expectThrowsAsync(
                () =>
                    contract.setBaseURI("https://api.test.com/cards/", {
                        from: accounts[1],
                    }),
                /revert/
            );
        });

        it("let's owner change baseURI", async () => {
            await expectNotThrowsAsync(() =>
                contract.setBaseURI("https://api.test.com/cards/", {
                    from: accounts[0],
                })
            );

            const baseURI = await contract.baseURI();

            expect(baseURI).to.be.equal("https://api.test.com/cards/");
        });

        it("let's owner change baseURISuffix", async () => {
            await expectNotThrowsAsync(() =>
                contract.setBaseURI("https://api.darkemblem.com/cards/", {
                    from: accounts[0],
                })
            );
            await expectNotThrowsAsync(() =>
                contract.setBaseURISuffix(".json", {
                    from: accounts[0],
                })
            );

            const baseURI = await contract.baseURI();

            expect(baseURI).to.be.equal("https://api.darkemblem.com/cards/");

            const cardURI = await contract.tokenURI(1);
            expect(cardURI).to.be.equal(
                "https://api.darkemblem.com/cards/1.json"
            );
        });
    });
});
