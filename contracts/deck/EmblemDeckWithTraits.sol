// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./EmblemDeckBase.sol";

abstract contract EmblemDeckWithTraits is EmblemDeckBase {
    /// @dev store for the cooldown for a given card
    mapping(uint256 => uint256) public cardIdToCooldown;

    /// @dev each time we need something random, increment the nonce and use it
    uint256 internal randNonce = uint256(1);

    function getCooldown(uint256 cardId) external view returns (uint256) {
        return cardIdToCooldown[cardId];
    }

    function _getCooldownForRank(uint256 rank) internal pure returns (uint256) {
        // A card's cooldown is equal to 2 ^ rank hours.
        uint256 cooldownHours = 0;

        // Clamp the rank to 8 (gives a cooldown of about 1 week).
        uint256 clampedRank = rank > 8 ? 8 : rank;

        cooldownHours = 2**clampedRank;

        // Convert to seconds
        return cooldownHours * 60 * 60;
    }

    function _ascend(uint256 cardId1, uint256 cardId2)
        private
        returns (uint256)
    {
        Card storage matron = cards[cardId1];
        Card storage sire = cards[cardId2];

        // Determine the higher rank number of the two parents
        uint16 parentRank = matron.rank;
        if (sire.rank > matron.rank) {
            parentRank = sire.rank;
        }

        // Call the sooper-sekret gene mixing operation.
        randNonce++;
        uint256 childTraits = ascendScience.mixTraits(
            matron.traits,
            sire.traits,
            randNonce
        );

        // set the cooldown for all cards
        cardIdToCooldown[cardId2] =
            block.timestamp +
            _getCooldownForRank(sire.rank);
        cardIdToCooldown[cardId1] =
            block.timestamp +
            _getCooldownForRank(matron.rank);

        address owner = msg.sender;
        uint256 newCardId = _createCard(
            cardId1,
            cardId2,
            parentRank + 1,
            currentPackId,
            matron.cardType,
            childTraits,
            owner
        );

        // set the cooldown for the new card
        //slither-disable-next-line reentrancy-benign
        cardIdToCooldown[newCardId] =
            block.timestamp +
            _getCooldownForRank(parentRank + 1);

        return newCardId;
    }

    function ascend(uint256 cardId1, uint256 cardId2) external payable {
        // Checks for payment.
        require(
            msg.value >= currentAscendPrice,
            "Not enough ETH sent to Ascend."
        );

        // Caller must own the matron.
        require(_owns(msg.sender, cardId1), "You do not own card 1");

        // Caller must own the sire.
        require(_owns(msg.sender, cardId2), "You do not own card 2");

        // Require that the current time is less than the cooldown time
        require(
            block.timestamp > cardIdToCooldown[cardId1] ||
                cardIdToCooldown[cardId1] == 0,
            "Card 1 is on cooldown."
        );
        require(
            block.timestamp > cardIdToCooldown[cardId2] ||
                cardIdToCooldown[cardId2] == 0,
            "Card 2 is on cooldown."
        );

        Card storage matron = cards[cardId1];
        Card storage sire = cards[cardId2];

        require(matron.cardType == sire.cardType, "Card Types must match");
        require(
            matron.cardType == 0,
            "Cannot Ascend a card that is not a Hero card."
        );

        _ascend(cardId1, cardId2);
    }

    function _transmogrify(
        uint256 cardId1,
        uint256 cardId2,
        uint256 cardId3
    ) private returns (uint256) {
        Card storage card1 = cards[cardId1];
        Card storage card2 = cards[cardId2];
        Card storage card3 = cards[cardId3];

        // Determine the higher rank number of the two parents
        uint16 parentRank = card1.rank;
        if (card2.rank > card1.rank) {
            parentRank = card2.rank;
        }

        if (card3.rank > card2.rank) {
            parentRank = card3.rank;
        }

        randNonce++;

        //slither-disable-next-line reentrancy-benign -- this is a call to a pure function
        uint256 childTraits = ascendScience.transmogrifyTraits(
            card1.traits,
            card2.traits,
            card3.traits,
            randNonce
        );

        address owner = msg.sender;

        // Burn before creating the card to prevent reentrancy.
        _burn(cardId1);
        _burn(cardId2);
        _burn(cardId3);

        // NOTE I'm not sure it even makes sense to have parent cards here. They get burned anyway.
        // TODO uh oh we lost cardId3 lol
        uint256 newCardId = _createCard(
            cardId1,
            cardId2,
            parentRank + 1,
            currentPackId,
            card1.cardType,
            childTraits,
            owner
        );

        return newCardId;
    }

    function transmogrify(
        uint256 cardId1,
        uint256 cardId2,
        uint256 cardId3
    ) external payable {
        // Checks for payment.
        require(
            msg.value >= currentAscendPrice,
            "Not enough ETH to transmogrify"
        );

        // Caller must own the card2.
        require(_owns(msg.sender, cardId1), "You do not own card 1");
        require(_owns(msg.sender, cardId2), "You do not own card 2");
        require(_owns(msg.sender, cardId3), "You do not own card 3");

        Card storage card1 = cards[cardId1];
        Card storage card2 = cards[cardId2];
        Card storage card3 = cards[cardId3];

        // Cards must match
        require(
            card1.cardType == card2.cardType,
            "Cards are not the same type"
        );
        require(
            card2.cardType == card3.cardType,
            "Cards are not the same type"
        );
        // Not a character card
        require(card1.cardType != 0x0, "Cards must be non-hero cards");

        // TODO add any other checks here
        _transmogrify(cardId1, cardId2, cardId3);
    }
}
