// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "../ascendScience/AscendScienceInterface.sol";
import "../auctions/EmblemAuctions.sol";
import "../common/EmblemAccessControl.sol";

abstract contract EmblemDeckKnobs is EmblemAccessControl {
    uint256 public constant PROMO_STARTING_PRICE = 1 ether;
    uint256 public constant PROMO_AUCTION_DURATION = 1 days;

    /// @dev Token prefix to set once
    string public _tokenBaseURI = "https://api.darkemblem.com/cards/";
    /// @dev Token suffix to set once
    string public _tokenBaseURISuffix = "";
    /// @dev Basically, seasonPackLimit is so big we'll never hit it.
    /// Its here to allow pack limits if we decide to turn them on.
    uint256 public seasonPackLimit =
        0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    /// @dev seasonPacksMinted gets updated when a pack is minted.
    /// Resets when a new packId is set
    uint32 public seasonPacksMinted = 0;
    /// @dev Ascend/Transmogrify price
    uint256 public currentAscendPrice = 0.002 ether;
    /// @dev The current packId
    uint32 public currentPackId = 1195724336; // GEN0

    /// @dev how many types of cards we map to
    uint256 public maxCardTypes = 2;

    uint256 public currentPackPrice = 0.02 ether;

    uint256 public currentCardsPerPack = 3;

    /// @dev The address of the contract that is used to implement the
    ///  hero/equipment trait functionality.
    AscendScienceInterface public ascendScience;

    EmblemAuctions public saleAuction;

    /// @dev The address of the ERC20 contract
    ERC20 public emblemTokenERC20;

    function setBaseURI(string memory uri) external onlyCLevel {
        _tokenBaseURI = uri;
    }

    function setBaseURISuffix(string memory suffix) external onlyCLevel {
        _tokenBaseURISuffix = suffix;
    }

    /// @dev Sets the ascend science address
    function setAscendScienceAddress(address newAaddress) external onlyCEO {
        require(
            newAaddress != address(0),
            "AscendScience address cannot be the zero address."
        );
        AscendScienceInterface candidateContract = AscendScienceInterface(
            newAaddress
        );

        require(
            candidateContract.IS_ASCEND_SCIENCE(),
            "Address is not a Ascend Science contract"
        );

        ascendScience = candidateContract;
    }

    function setSeasonPackLimit(uint256 newSeasonPackLimit)
        external
        onlyCLevel
    {
        emit ContractKnobUpdated(
            "seasonPackLimit",
            seasonPackLimit,
            newSeasonPackLimit
        );

        seasonPackLimit = newSeasonPackLimit;
    }

    function setCurrentAscendPrice(uint256 newPrice) external onlyCEO {
        emit ContractKnobUpdated(
            "currentAscendPrice",
            currentAscendPrice,
            newPrice
        );

        currentAscendPrice = newPrice;
    }

    function setCurrentPackId(uint32 newPackId) external onlyCEO {
        emit ContractKnobUpdated("currentPackId", currentPackId, newPackId);

        currentPackId = newPackId;

        // Also reset the season pack limit
        seasonPacksMinted = 0;
    }

    /// @dev Sets the reference to the sale auction.
    /// @param newAddress - Address of sale contract.
    function setSaleAuctionAddress(address newAddress) external onlyCEO {
        EmblemAuctions candidateContract = EmblemAuctions(newAddress);

        require(candidateContract.IS_SALE_CLOCK_AUCTION());

        // Set the new contract address
        saleAuction = candidateContract;
    }

    function setEmblemTokenContract(address newTokenAddress)
        external
        onlyCLevel
    {
        ERC20 candidateContract = ERC20(newTokenAddress);

        // ERC20 standard was before ERC165, where supportsInterface was defined
        // require(
        //     candidateContract.supportsInterface(type(IERC20).interfaceId),
        //     "Contract does not support ERC-20"
        // );
        emblemTokenERC20 = candidateContract;
    }

    function setCurrentCardsPerPack(uint256 newCurrentCardsPerPack)
        external
        onlyCLevel
    {
        emit ContractKnobUpdated(
            "currentCardsPerPack",
            currentCardsPerPack,
            newCurrentCardsPerPack
        );

        currentCardsPerPack = newCurrentCardsPerPack;
    }

    function setCurrentPackPrice(uint256 newCurrentPackPrice)
        external
        onlyCLevel
    {
        emit ContractKnobUpdated(
            "currentPackPrice",
            currentPackPrice,
            newCurrentPackPrice
        );

        currentPackPrice = newCurrentPackPrice;
    }

    function setMaxCardTypes(uint256 newMaxCardTypes) external onlyCLevel {
        emit ContractKnobUpdated("maxCardTypes", maxCardTypes, newMaxCardTypes);

        maxCardTypes = newMaxCardTypes;
    }

    function unpause() public override onlyCEO whenPaused {
        require(address(saleAuction) != address(0));
        require(
            address(ascendScience) != address(0),
            "Ascend Science contract not set"
        );

        super.unpause();
    }

    /// @dev Allows the CFO to capture the balance available to the contract.
    /// Will only send the balance to the CFO address.
    function withdrawBalance() external onlyCFO {
        uint256 balance = address(this).balance;
        uint256 subtractFees = 0;

        if (balance > subtractFees) {
            (bool success, ) = cfoAddress.call{value: balance - subtractFees}(
                ""
            );
            require(success, "Transfer failed.");
        }
    }
}
