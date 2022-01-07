const EmblemMigrations = artifacts.require("EmblemMigrations");

module.exports = async function (deployer) {
    // Deploy the EmblemMigrations contract as our only task
    await deployer.deploy(EmblemMigrations);
};
