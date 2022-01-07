// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

abstract contract EmblemDeckInterface is ERC721Enumerable {
    uint32 public currentPackId;
}
