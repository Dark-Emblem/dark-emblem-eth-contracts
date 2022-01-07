const EmblemDeck = artifacts.require("EmblemDeck");
const EmblemDrem = artifacts.require("EmblemDrem");

module.exports = async function (deployer) {
    const emblemCore = await EmblemDeck.deployed();

    // Deploy EmblemDrem
    await deployer.deploy(EmblemDrem, emblemCore.address);
};
