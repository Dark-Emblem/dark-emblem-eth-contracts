const EmblemDeck = artifacts.require("EmblemDeck");
const EmblemAuctions = artifacts.require("EmblemAuctions");

// eslint-disable-next-line no-unused-vars -- deployer is required by truffle
module.exports = async function (deployer) {
    const emblemDeck = await EmblemDeck.deployed();
    const saleClockAuction = await EmblemAuctions.deployed();

    await emblemDeck.setSaleAuctionAddress(saleClockAuction.address);
};
