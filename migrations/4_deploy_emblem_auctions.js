const EmblemDeck = artifacts.require("EmblemDeck");
const EmblemAuctions = artifacts.require("EmblemAuctions");

module.exports = async function (deployer) {
    const emblemDeck = await EmblemDeck.deployed();

    // Deploy EmblemAuctions
    await deployer.deploy(EmblemAuctions, emblemDeck.address, 1000);
};
