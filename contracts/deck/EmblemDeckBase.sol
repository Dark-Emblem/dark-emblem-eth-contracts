// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "./EmblemDeckKnobs.sol";

abstract contract EmblemDeckBase is
    EmblemDeckKnobs,
    ERC721Enumerable,
    IERC721Receiver
{
    struct Card {
        uint256 traits;
        uint64 createdTime;
        uint32 matronId;
        uint32 sireId;
        uint16 rank;
        uint32 packId;
        uint32 cardType;
    }

    event CardCreated(
        address owner,
        uint256 cardId,
        uint256 matronId,
        uint256 sireId,
        uint32 cardType,
        uint256 traits,
        uint16 rank,
        uint32 packId
    );

    Card[] public cards;

    /// @dev Always returns `IERC721Receiver.onERC721Received.selector`.
    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) external virtual override returns (bytes4) {
        // is there anything to do here?
        return this.onERC721Received.selector;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _tokenBaseURI;
    }

    function baseURI() external view returns (string memory) {
        return _baseURI();
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token."
        );
        string memory uri = _baseURI();
        return
            bytes(uri).length > 0
                ? string(
                    abi.encodePacked(
                        uri,
                        Strings.toString(tokenId),
                        _tokenBaseURISuffix
                    )
                )
                : "";
    }

    function transfer(address to, uint256 tokenId) external whenNotPaused {
        require(to != address(0), "Cannot transfer to 0x0");
        require(to != address(this), "Cannot transfer to contract itself");
        require(
            to != address(saleAuction),
            "Cannot transfer to the sale auction"
        );
        require(_owns(msg.sender, tokenId));
        _transfer(msg.sender, to, tokenId);
    }

    function _getRandomInRange(
        uint256 min,
        uint256 max,
        uint256 salt
    ) internal view returns (uint256) {
        uint256 range = max - min;
        uint256 r = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.number,
                    msg.sender,
                    salt,
                    range
                )
            )
        );
        return min + (r % range);
    }

    function _owns(address claimant, uint256 tokenId)
        internal
        view
        returns (bool)
    {
        return claimant == ownerOf(tokenId);
    }

    function _createCard(
        uint256 matronId,
        uint256 sireId,
        uint256 rank,
        uint32 packId,
        uint32 cardType,
        uint256 traits,
        address owner
    ) internal returns (uint256) {
        Card memory _card = Card({
            traits: traits,
            createdTime: uint64(block.timestamp),
            matronId: uint32(matronId),
            sireId: uint32(sireId),
            packId: packId,
            rank: uint16(rank),
            cardType: cardType
        });

        cards.push(_card);
        uint256 newCardId = cards.length - 1;

        emit CardCreated(
            owner,
            newCardId,
            uint256(_card.matronId),
            uint256(_card.sireId),
            _card.cardType,
            _card.traits,
            _card.rank,
            _card.packId
        );

        _safeMint(owner, newCardId);

        return newCardId;
    }

    /// @dev get ALL the token ids for the given owner.
    /// This is a slow operation, so use it sparingly.
    /// It is recommended to use `balanceOf` and `tokenOfOwnerByIndex` instead.
    function getCardsByOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    function getCardById(uint256 cardId)
        external
        view
        returns (
            uint256 id,
            uint256 createdTime,
            uint256 matronId,
            uint256 sireId,
            uint256 rank,
            uint32 cardType,
            uint32 packId,
            uint256 traits
        )
    {
        Card storage card = cards[cardId];

        id = cardId;
        createdTime = uint256(card.createdTime);
        matronId = uint256(card.matronId);
        sireId = uint256(card.sireId);
        rank = uint256(card.rank);
        packId = card.packId;
        cardType = card.cardType;
        traits = card.traits;
    }
}
