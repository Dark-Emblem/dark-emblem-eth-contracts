const AscendScience = artifacts.require("AscendScience");

module.exports = async function (deployer) {
    // Deploy Trait Science
    await deployer.deploy(AscendScience);
};
