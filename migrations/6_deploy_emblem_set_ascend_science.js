const EmblemDeck = artifacts.require("EmblemDeck");
const AscendScience = artifacts.require("AscendScience");

// eslint-disable-next-line no-unused-vars -- deployer is required by truffle
module.exports = async function (deployer) {
    const emblemDeck = await EmblemDeck.deployed();
    const ascendScience = await AscendScience.deployed();

    await emblemDeck.setAscendScienceAddress(ascendScience.address);
};
