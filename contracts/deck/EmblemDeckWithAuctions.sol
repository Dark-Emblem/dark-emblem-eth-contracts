// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./EmblemDeckBase.sol";

abstract contract EmblemDeckWithAuctions is EmblemDeckBase {
    /// @dev Put a card up for auction.
    ///  Does some ownership trickery to create auctions in one tx.
    function createSaleAuction(
        uint256 cardId,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration
    ) external whenNotPaused {
        // Auction contract checks input sizes
        // If card is already on any auction, this will throw
        // because it will be owned by the auction contract.
        require(_owns(msg.sender, cardId));
        // NOTE: the card IS allowed to be in a cooldown.
        _approve(address(saleAuction), cardId);
        // Sale auction throws if inputs are invalid and clears
        // transfer after escrowing the card.
        saleAuction.createAuction(
            cardId,
            startingPrice,
            endingPrice,
            duration,
            payable(msg.sender)
        );
    }

    /// @dev Computes the next PROMO auction starting price, given
    ///  the average of the past 5 prices + 50%.
    function _computeNextPromoPrice() internal view returns (uint256) {
        uint256 avePrice = saleAuction.averagePromoSalePrice();

        // Sanity check to ensure we don't overflow arithmetic
        require(avePrice == uint256(uint128(avePrice)));

        uint256 nextPrice = avePrice + (avePrice / 2);

        // We never auction for less than starting price
        if (nextPrice < PROMO_STARTING_PRICE) {
            nextPrice = PROMO_STARTING_PRICE;
        }

        return nextPrice;
    }

    /// @dev Creates a new promo card with the given traits and
    ///  creates an auction for it.
    function createPromoAuction(uint32 cardType, uint256 traits)
        external
        onlyCOO
    {
        require(address(saleAuction) != address(0));
        uint256 cardId = _createCard(
            0,
            0,
            0,
            currentPackId,
            cardType,
            traits,
            address(this)
        );
        _approve(address(saleAuction), cardId);

        saleAuction.createAuction(
            cardId,
            _computeNextPromoPrice(),
            0,
            PROMO_AUCTION_DURATION,
            payable(address(this))
        );
    }
}
