// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "../common/EmblemAccessControl.sol";

abstract contract EmblemAuctionsKnobs is EmblemAccessControl {
    /// @dev The ERC-165 interface signature for ERC-721.
    // TODO is this the best way to check this?
    bytes4 constant InterfaceSignature_ERC721 = bytes4(0x80ac58cd);

    /// @dev contract reference can be updated to a new one if needed
    ERC721 internal nonFungibleContract;

    /// @dev Cut owner takes on each auction, measured in basis points (1/100 of a percent).
    /// Values 0-10,000 map to 0%-100%
    uint256 internal ownerCut;

    /// @dev Constructor creates a reference to the NFT ownership contract
    ///  and verifies the owner cut is in the valid range.
    /// @param nftAddress - address of a deployed contract implementing
    ///  the Nonfungible Interface.
    /// @param cut - percent cut the owner takes on each auction, must be
    ///  between 0-10,000.
    constructor(address nftAddress, uint256 cut) {
        require(cut <= 10000, "Cut must be between 0-10000");
        ownerCut = cut;

        ERC721 candidateContract = ERC721(nftAddress);
        require(
            candidateContract.supportsInterface(InterfaceSignature_ERC721),
            "NFT contract does not support ERC-721"
        );
        nonFungibleContract = candidateContract;

        ceoAddress = payable(msg.sender);
        cooAddress = payable(msg.sender);
        cfoAddress = payable(msg.sender);
    }

    /// @dev Remove all Ether from the contract, which is the owner's cuts
    ///  as well as any Ether sent directly to the contract address.
    ///  Always transfers to the NFT contract, but can be called either by
    ///  the owner or the NFT contract.
    function withdrawBalance() external {
        address payable nftAddress = payable(address(nonFungibleContract));

        require(
            msg.sender == cfoAddress || msg.sender == nftAddress,
            "Only owner or NFT contract can withdraw balance"
        );
        // We are using this boolean method to make sure that even if one fails it will still work
        (bool success, ) = nftAddress.call{value: address(this).balance}("");
        require(success, "Transfer failed.");
    }

    /// @dev owner can update NFT contract address
    function setNFTContract(address nftAddress) external onlyCLevel {
        ERC721 candidateContract = ERC721(nftAddress);
        require(
            candidateContract.supportsInterface(InterfaceSignature_ERC721),
            "NFT contract does not support ERC-721"
        );

        nonFungibleContract = candidateContract;
    }

    /// @dev owner can update owner cut
    function setOwnerCut(uint256 cut) external onlyCFO {
        require(cut <= 10000, "Cut must be between 0-10000");

        emit ContractKnobUpdated("setOwnerCut", ownerCut, cut);

        ownerCut = cut;
    }
}
