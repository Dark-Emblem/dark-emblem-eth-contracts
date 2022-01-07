const EmblemDeck = artifacts.require("EmblemDeck");
const EmblemDrem = artifacts.require("EmblemDrem");

// eslint-disable-next-line no-unused-vars -- deployer is required by truffle
module.exports = async function (deployer) {
    const emblemDeck = await EmblemDeck.deployed();
    const emblemToken = await EmblemDrem.deployed();
    // Set EmblemDrem as EmblemDeck's token
    await emblemDeck.setEmblemTokenContract(emblemToken.address);
};
