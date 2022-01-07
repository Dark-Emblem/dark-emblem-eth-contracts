const EmblemDeck = artifacts.require("EmblemDeck");

// eslint-disable-next-line no-unused-vars -- deployer is required by truffle
module.exports = async function (deployer) {
    const emblemDeck = await EmblemDeck.deployed();

    // Get contract ready for use
    await emblemDeck.unpause();
};
