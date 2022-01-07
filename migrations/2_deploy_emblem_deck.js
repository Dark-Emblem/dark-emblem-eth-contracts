const EmblemDeck = artifacts.require("EmblemDeck");

module.exports = async function (deployer) {
    // Deploy Emblem Core
    await deployer.deploy(EmblemDeck);
};
