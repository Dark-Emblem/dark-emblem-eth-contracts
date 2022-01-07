// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./EmblemAuctionsKnobs.sol";

abstract contract EmblemAuctionsBase is EmblemAuctionsKnobs, ReentrancyGuard {
    /// @dev NFT Auction structure
    struct Auction {
        address payable seller;
        // Price (in wei) at beginning of auction
        uint128 startingPrice;
        // Price (in wei) at end of auction
        uint128 endingPrice;
        // Duration (in seconds) of auction
        uint64 duration;
        // Time when auction started
        // NOTE: 0 if this auction has been concluded
        uint64 startedAt;
    }

    /// @dev Sanity check that allows us to ensure that we are pointing to the
    /// right auction in our setSaleAuctionAddress() call.
    bool public constant IS_SALE_CLOCK_AUCTION = true;

    // Map from token ID to their corresponding auction.
    mapping(uint256 => Auction) public tokenIdToAuction;

    // Array of token up for auction
    uint256[] public auctionIds;

    // Map a tokenId to the auctionIds INDEX
    mapping(uint256 => uint256) public auctionIndex;

    event AuctionCreated(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration
    );
    event AuctionSuccessful(
        uint256 tokenId,
        uint256 totalPrice,
        address winner
    );
    event AuctionCancelled(uint256 tokenId);

    // Delegate constructor
    constructor(address _nftAddr, uint256 _cut)
        EmblemAuctionsKnobs(_nftAddr, _cut)
    {}

    function getAuctions() external view returns (uint256[] memory) {
        return auctionIds;
    }

    /// @dev Returns auction info for an NFT on auction.
    /// @param tokenId - ID of NFT on auction.
    function getAuction(uint256 tokenId)
        external
        view
        returns (
            address seller,
            uint256 startingPrice,
            uint256 endingPrice,
            uint256 duration,
            uint256 startedAt
        )
    {
        Auction storage auction = tokenIdToAuction[tokenId];
        require(_isOnAuction(auction), "Auction is not live.");
        return (
            auction.seller,
            auction.startingPrice,
            auction.endingPrice,
            auction.duration,
            auction.startedAt
        );
    }

    /// @dev Escrows the NFT, assigning ownership to this contract.
    /// Throws if the escrow fails.
    /// @param currentOwner - Current currentOwner address of token to escrow.
    /// @param tokenId - ID of token whose approval to verify.
    function _escrow(address currentOwner, uint256 tokenId) internal {
        // it will throw if transfer fails
        nonFungibleContract.transferFrom(
            currentOwner,
            payable(address(this)),
            tokenId
        );
    }

    /// @dev Transfers an NFT owned by this contract to another address.
    /// Returns true if the transfer succeeds.
    /// @param receiver - Address to transfer NFT to.
    /// @param tokenId - ID of token to transfer.
    function _transfer(address receiver, uint256 tokenId) internal {
        // it will throw if transfer fails

        nonFungibleContract.safeTransferFrom(address(this), receiver, tokenId);
    }

    /// @dev Adds an auction to the list of open auctions. Also fires the
    ///  AuctionCreated event.
    /// @param tokenId The ID of the token to be put on auction.
    /// @param auction Auction to add.
    function _addAuction(uint256 tokenId, Auction memory auction) internal {
        // Require that all auctions have a duration of
        // at least one minute. (Keeps our math from getting hairy!)
        require(auction.duration >= 1 minutes);

        tokenIdToAuction[tokenId] = auction;
        auctionIds.push(tokenId);
        uint256 index = auctionIds.length - 1;
        auctionIndex[tokenId] = index;

        AuctionCreated(
            uint256(tokenId),
            uint256(auction.startingPrice),
            uint256(auction.endingPrice),
            uint256(auction.duration)
        );
    }

    /// @dev Creates and begins a new auction.
    /// @param tokenId - ID of token to auction, sender must be owner.
    /// @param startingPrice - Price of item (in wei) at beginning of auction.
    /// @param endingPrice - Price of item (in wei) at end of auction.
    /// @param duration - Length of auction (in seconds).
    /// @param seller - Seller, if not the message sender
    function createAuction(
        uint256 tokenId,
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration,
        address payable seller
    ) external whenNotPaused {
        // Sanity check that no inputs overflow how many bits we've allocated
        // to store them in the auction struct.
        require(startingPrice == uint256(uint128(startingPrice)));
        require(endingPrice == uint256(uint128(endingPrice)));
        require(duration == uint256(uint64(duration)));

        require(msg.sender == address(nonFungibleContract));
        Auction memory auction = Auction(
            seller,
            uint128(startingPrice),
            uint128(endingPrice),
            uint64(duration),
            uint64(block.timestamp)
        );
        _addAuction(tokenId, auction);
        _escrow(seller, tokenId);
    }

    /// @dev Cancels an auction unconditionally.
    function _cancelAuction(uint256 tokenId, address seller) internal {
        _removeAuction(tokenId);
        _transfer(seller, tokenId);
        emit AuctionCancelled(tokenId);
    }

    /// @dev Cancels an auction that hasn't been won yet.
    ///  Returns the NFT to original owner.
    /// @param tokenId - ID of token on auction
    function cancelAuction(uint256 tokenId) external whenNotPaused {
        Auction storage auction = tokenIdToAuction[tokenId];
        require(_isOnAuction(auction), "Auction is not live.");
        address seller = auction.seller;
        require(msg.sender == seller, "Only the seller can cancel an auction");

        _cancelAuction(tokenId, seller);
    }

    /// @dev Computes the price and transfers winnings.
    /// Does NOT transfer ownership of token.
    function _bid(uint256 tokenId, uint256 bidAmount)
        internal
        nonReentrant
        returns (uint256)
    {
        // Get a reference to the auction struct
        Auction storage auction = tokenIdToAuction[tokenId];

        // Explicitly check that this auction is currently live.
        // (Because of how Ethereum mappings work, we can't just count
        // on the lookup above failing. An invalid tokenId will just
        // return an auction object that is all zeros.)
        require(_isOnAuction(auction), "Auction is not live.");

        // Check that the bid is greater than or equal to the current price
        uint256 price = _currentPrice(auction);
        require(
            bidAmount >= price,
            "Bid must be greater than or equal to current price."
        );

        // Grab a reference to the seller before the auction struct
        // gets deleted.
        address payable seller = auction.seller;

        // The bid is good! Remove the auction before sending the fees
        // to the sender so we can't have a reentrancy attack.
        _removeAuction(tokenId);

        // The full bid amount is split between the seller and the auctioneer.
        // Any "bidExcess" (bid amount minus the price) is split as well. It is
        // NOT refunded like in some ClockAuction implementations.

        // Transfer proceeds to seller (if there are any!)
        if (bidAmount > 0) {
            // Calculate the auctioneer's cut.
            // (NOTE: _computeCut() is guaranteed to return a
            // value <= price, so this subtraction can't go negative.)
            uint256 auctioneerCut = _computeCut(bidAmount);
            uint256 sellerProceeds = bidAmount - auctioneerCut;

            // Tell the world!
            AuctionSuccessful(tokenId, price, msg.sender);

            // NOTE: Doing a transfer() in the middle of a complex
            // method like this is generally discouraged because of
            // reentrancy attacks and DoS attacks if the seller is
            // a contract with an invalid fallback function. We explicitly
            // guard against reentrancy attacks by removing the auction
            // before calling transfer(), and the only thing the seller
            // can DoS is the sale of their own asset! (And if it's an
            // accident, they can call cancelAuction(). )
            seller.transfer(sellerProceeds);
        }

        return price;
    }

    /// @dev Bids on an open auction, completing the auction and transferring
    ///  ownership of the NFT if enough Ether is supplied.
    /// @param tokenId - ID of token to bid on.
    function bid(uint256 tokenId) external payable virtual whenNotPaused {
        // _bid will throw if the bid or funds transfer fails
        _bid(tokenId, msg.value);
        _transfer(msg.sender, tokenId);
    }

    /// @dev Removes an auction from the list of open auctions.
    /// @param tokenId - ID of NFT on auction.
    function _removeAuction(uint256 tokenId) internal {
        delete tokenIdToAuction[tokenId];

        uint256 index = auctionIndex[tokenId];

        auctionIds[index] = auctionIds[auctionIds.length - 1];
        delete auctionIds[auctionIds.length - 1];
        auctionIds.pop();
    }

    /// @dev Returns true if the NFT is on auction.
    /// @param auction - Auction to check.
    function _isOnAuction(Auction storage auction)
        internal
        view
        returns (bool)
    {
        return (auction.startedAt > 0);
    }

    /// @dev Returns current price of an NFT on auction. Broken into two
    ///  functions (this one, that computes the duration from the auction
    ///  structure, and the other that does the price computation) so we
    ///  can easily test that the price computation works correctly.
    function _currentPrice(Auction storage _auction)
        internal
        view
        returns (uint256)
    {
        uint256 secondsPassed = 0;

        // A bit of insurance against negative values (or wraparound).
        // Probably not necessary (since Ethereum guarnatees that the
        // now variable doesn't ever go backwards).
        if (block.timestamp > _auction.startedAt) {
            secondsPassed = block.timestamp - _auction.startedAt;
        }

        return
            _computeCurrentPrice(
                _auction.startingPrice,
                _auction.endingPrice,
                _auction.duration,
                secondsPassed
            );
    }

    /// @dev Computes the current price of an auction. Factored out
    ///  from _currentPrice so we can run extensive unit tests.
    ///  When testing, make this function public and turn on
    ///  `Current price computation` test suite.
    function _computeCurrentPrice(
        uint256 startingPrice,
        uint256 endingPrice,
        uint256 duration,
        uint256 secondsPassed
    ) internal pure returns (uint256) {
        // NOTE: We don't use SafeMath (or similar) in this function because
        //  all of our public functions carefully cap the maximum values for
        //  time (at 64-bits) and currency (at 128-bits). duration is
        //  also known to be non-zero (see the require() statement in
        //  _addAuction())
        if (secondsPassed >= duration) {
            // We've reached the end of the dynamic pricing portion
            // of the auction, just return the end price.
            return endingPrice;
        } else {
            // Starting price can be higher than ending price (and often is!), so
            // this delta can be negative.
            int256 totalPriceChange = int256(endingPrice) -
                int256(startingPrice);

            // This multiplication can't overflow, secondsPassed will easily fit within
            // 64-bits, and totalPriceChange will easily fit within 128-bits, their product
            // will always fit within 256-bits.
            int256 currentPriceChange = (totalPriceChange *
                int256(secondsPassed)) / int256(duration);

            // currentPriceChange can be negative, but if so, will have a magnitude
            // less that startingPrice. Thus, this result will always end up positive.
            int256 currentPrice = int256(startingPrice) + currentPriceChange;

            return uint256(currentPrice);
        }
    }

    /// @dev Returns the current price of an auction.
    /// @param tokenId - ID of the token price we are checking.
    function getCurrentPrice(uint256 tokenId) external view returns (uint256) {
        Auction storage auction = tokenIdToAuction[tokenId];
        require(_isOnAuction(auction), "Auction is not live.");
        return _currentPrice(auction);
    }

    /// @dev Computes owner's cut of a sale.
    /// @param _price - Sale price of NFT.
    function _computeCut(uint256 _price) internal view returns (uint256) {
        // NOTE: We don't use SafeMath (or similar) in this function because
        //  all of our entry functions carefully cap the maximum values for
        //  currency (at 128-bits), and ownerCut <= 10000 (see the require()
        //  statement in the ClockAuction constructor). The result of this
        //  function is always guaranteed to be <= _price.
        return (_price * ownerCut) / 10000;
    }
}
