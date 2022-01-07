// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

abstract contract AscendScienceInterface {
    /// @dev simply a boolean to indicate this is the contract we expect to be
    function IS_ASCEND_SCIENCE() external pure virtual returns (bool);

    function mixTraits(
        uint256 traits1,
        uint256 traits2,
        uint256 nonce
    ) public virtual returns (uint256);

    function transmogrifyTraits(
        uint256 traits1,
        uint256 traits2,
        uint256 traits3,
        uint256 nonce
    ) external virtual returns (uint256);

    function getRandomTraits(
        uint256 salt1,
        uint256 salt2,
        uint256 boost
    ) external view virtual returns (uint256);
}
