// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./EmblemAuctionsBase.sol";

contract EmblemAuctionsWithPromos is EmblemAuctionsBase {
    // Tracks last 5 sale price of promo card sales
    uint256 public promoSaleCount;
    uint256[5] public lastPromoSalePrices;

    // Delegate constructor
    constructor(address _nftAddr, uint256 _cut)
        EmblemAuctionsBase(_nftAddr, _cut)
    {}

    /// @dev Updates lastSalePrice if seller is the nft contract
    /// Otherwise, works the same as default bid method.
    function bid(uint256 tokenId) external payable override whenNotPaused {
        // _bid verifies token ID size
        address seller = tokenIdToAuction[tokenId].seller;
        uint256 price = _bid(tokenId, msg.value);

        // If not a promo auction, exit
        //slither-disable-next-line incorrect-equality
        if (seller == address(nonFungibleContract)) {
            // Track promo sale prices
            lastPromoSalePrices[promoSaleCount % 5] = price;
            promoSaleCount++;
        }

        _transfer(msg.sender, tokenId);
    }

    function averagePromoSalePrice() external view returns (uint256) {
        uint256 sum = 0;
        for (uint256 i = 0; i < 5; i++) {
            sum += lastPromoSalePrices[i];
        }
        return sum / 5;
    }
}
