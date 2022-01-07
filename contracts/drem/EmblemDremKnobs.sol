// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

import "../deck/EmblemDeckInterface.sol";
import "../common/EmblemAccessControl.sol";

abstract contract EmblemDremKnobs is EmblemAccessControl {
    /// @dev The ERC-165 interface signature for ERC-721.
    bytes4 constant InterfaceSignature_ERC721 =
        type(IERC721Enumerable).interfaceId;

    // Reference to contract tracking NFT ownership
    EmblemDeckInterface public nonFungibleContract;

    /// @dev The number of cards to get 1 DREM
    uint256 public rewardThreshold = 20;

    constructor(address nftAddress) {
        ceoAddress = payable(msg.sender);
        cooAddress = payable(msg.sender);
        cfoAddress = payable(msg.sender);

        EmblemDeckInterface candidateContract = EmblemDeckInterface(nftAddress);
        require(
            candidateContract.supportsInterface(InterfaceSignature_ERC721),
            "NFT contract does not support ERC-721"
        );
        nonFungibleContract = candidateContract;
    }

    /// @dev CFO can update the reward threshold
    function setRewardThreshold(uint256 threshold) external onlyCFO {
        emit ContractKnobUpdated("rewardThreshold", rewardThreshold, threshold);

        rewardThreshold = threshold;
    }

    /// @dev C-level can update the NFT contract
    function setNFTContract(address nftAddress) external onlyCLevel {
        EmblemDeckInterface candidateContract = EmblemDeckInterface(nftAddress);
        require(
            candidateContract.supportsInterface(InterfaceSignature_ERC721),
            "NFT contract does not support ERC-721"
        );
        nonFungibleContract = candidateContract;
    }
}
