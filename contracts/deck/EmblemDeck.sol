// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./EmblemDeckWithAuctions.sol";
import "./EmblemDeckWithTraits.sol";

contract EmblemDeck is
    EmblemDeckWithAuctions,
    EmblemDeckWithTraits,
    ReentrancyGuard
{
    constructor() ERC721("Dark Emblem", "DECK") {
        _pause();
        ceoAddress = payable(msg.sender);
        cooAddress = payable(msg.sender);
        cfoAddress = payable(msg.sender);

        // Create card 0 and give it to the contract so no one can have it
        _createCard(0, 0, 0, currentPackId, 0x00, uint256(0), address(this));
    }

    event Received(address, uint256);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function createPromoCard(
        uint32 packId,
        uint32 cardType,
        uint256 traits,
        address owner
    ) external onlyCOO {
        address cardOwner = owner;
        if (cardOwner == address(0)) {
            cardOwner = cooAddress;
        }

        _createCard(0, 0, 0, packId, cardType, traits, cardOwner);
    }

    function _sliceNumber(
        uint256 _n,
        uint256 _nbits,
        uint256 _offset
    ) private pure returns (uint256) {
        // mask is made by shifting left an offset number of times
        uint256 mask = uint256((2**_nbits) - 1) << _offset;
        // AND n with mask, and trim to max of _nbits bits
        return uint256((_n & mask) >> _offset);
    }

    function _getRandomFromEntropy(
        uint256 entropy,
        uint256 offset,
        uint256 min,
        uint256 max
    ) internal returns (uint32) {
        uint32 slice = uint32(_sliceNumber(entropy, 5, offset));
        return uint32(min + (slice % (max - min + 1)));
    }

    function _buyCards(
        uint256 numCards,
        uint256 minHeroCards,
        address _cardOwner,
        uint256 boost
    ) internal nonReentrant {
        uint256 entropy = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.number,
                    msg.sender,
                    randNonce
                )
            )
        );

        uint256 numHeroCards = _getRandomFromEntropy(
            entropy,
            0,
            minHeroCards,
            numCards
        );

        uint256 salt = 1;
        for (uint256 i = 0; i < numCards; i++) {
            salt += i;

            uint32 cardType = 0;

            if (i < numHeroCards) {
                cardType = _getRandomFromEntropy(
                    entropy,
                    5 * i,
                    0x01,
                    maxCardTypes
                );
            }

            salt += i;

            _createCard(
                0,
                0,
                0,
                currentPackId,
                cardType,
                ascendScience.getRandomTraits(i, randNonce + salt, boost),
                _cardOwner
            );
        }

        randNonce += salt;
        seasonPacksMinted = seasonPacksMinted + 1;
    }

    function _buyPackBulk(address cardOwner, uint256 numPacks) internal {
        uint256 maxBulkPacks = 5;
        // Make sure nothing crazy happens with numPacks
        require(numPacks <= maxBulkPacks, "Too many packs requested");
        require(numPacks > 0, "Zero packs requested");
        require(
            seasonPacksMinted < seasonPackLimit,
            "Cannot mint any more packs this season"
        );

        uint32 boost = 0;

        if (numPacks >= maxBulkPacks) {
            boost = 100;
        } else if (numPacks >= 2) {
            boost = 40;
        } else {
            boost = 0;
        }

        _buyCards(currentCardsPerPack * numPacks, numPacks, cardOwner, boost);
    }

    function buyPack() external payable whenNotPaused {
        require(msg.value >= currentPackPrice);

        address cardOwner = msg.sender;
        (bool div, uint256 numPacks) = SafeMath.tryDiv(
            msg.value,
            currentPackPrice
        );

        require(div, "Divide by 0 error");

        _buyPackBulk(cardOwner, numPacks);
    }

    /// @dev buy packs using $DREM
    /// - You can buy a pack for someone else.
    /// - You can bulk-buy packs with amount
    function buyPackWithDrem(address to, uint256 amount)
        external
        whenNotPaused
    {
        require(to != address(0), "Cannot buy a pack for 0x0");
        require(
            address(emblemTokenERC20) != address(0),
            "ERC20 Contract not set"
        );

        // Transfer sale amount to seller
        bool sent = emblemTokenERC20.transferFrom(
            msg.sender,
            address(this),
            amount
        );
        require(sent, "Token transfer failed");

        _buyPackBulk(to, amount);
    }
}
