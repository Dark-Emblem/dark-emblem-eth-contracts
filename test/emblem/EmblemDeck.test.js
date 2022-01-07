const { expect } = require("chai");
const {
    expectThrowsAsync,
    expectNotThrowsAsync,
} = require("../common/helpers");
const emblemHelper = require("../common/emblemHelper");

const EmblemDeck = artifacts.require("EmblemDeck");
const AscendScience = artifacts.require("AscendScience");

contract("EmblemDeck", (accounts) => {
    let contract;
    let ascendScience;

    before(async () => {
        contract = await EmblemDeck.deployed();
        ascendScience = await AscendScience.deployed();
    });

    describe("deployment", () => {
        it("deploys successfully", async () => {
            const address = contract.address;

            // Contract address is not empty or the null address
            expect(address).to.not.be.empty;
            expect(address).to.not.be.equal(0x0);
        });

        it("has a name", async () => {
            const name = await contract.name();

            // Contract name is not empty
            expect(name).to.not.be.empty;
            expect(name).to.be.equal("Dark Emblem");
        });

        it("has a symbol", async () => {
            const symbol = await contract.symbol();

            // Contract symbol is not empty
            expect(symbol).to.not.be.empty;
            expect(symbol).to.be.equal("DECK");
        });
    });

    describe("safe guards", () => {
        // it('this contract allows people to send eth to it as a tip', async () => {
        //     await expectNotThrowsAsync(() => contract.sendTransaction({ from: accounts[0], value: web3.utils.toWei('0.002', 'ether') }));
        // });

        describe("pause", () => {
            it("can pause contract", async () => {
                await expectNotThrowsAsync(() => contract.pause());
            });
        });

        describe("unpause", () => {
            // This test fails when running with truffle test, because it is set when we migrated
            // it('can not unpause if trait science contract is not set', async () => {
            //     console.log(await contract.getAscendScienceAddress());
            //     await expectThrowsAsync(() => contract.unpause());
            // });

            it("can unpause if no new contract is set", async () => {
                try {
                    await contract.pause();
                } catch (_) {}
                await contract.setAscendScienceAddress(ascendScience.address);
                await expectNotThrowsAsync(() => contract.unpause());
            });
        });
    });

    describe("getCardById", () => {
        it("returns the card", async () => {
            await emblemHelper.mint(1, contract);

            const cardId = 0;
            const card = await contract.getCardById(cardId);

            expect(card).to.not.be.empty;
        });
    });

    describe("withdrawBalance", () => {
        it("COO can withdraw balance", async () => {
            await expectNotThrowsAsync(() =>
                contract.withdrawBalance({
                    from: accounts[0],
                })
            );
        });

        it("transfers balances for the CFO", async () => {
            // Buy a pack
            await contract.buyPack({
                from: accounts[0],
                value: emblemHelper.packCost,
            });

            await expectNotThrowsAsync(() =>
                contract.withdrawBalance({
                    from: accounts[0],
                })
            );

            // This should move 0.01 ETH from the contract to the CFO address
        });

        it("non-COO cannot withdraw balance", async () => {
            await expectThrowsAsync(() =>
                contract.withdrawBalance({ from: accounts[1] })
            );
        });
    });
});
