const chai = require("chai");
const BN = require("bn.js");

before(() => {
    chai.use(require("chai-as-promised")).should();

    // Using https://github.com/OpenZeppelin/chai-bn because chai-bignumber doesn't work
    chai.use(require("chai-bn")(BN));
});
