// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract EmblemAccessControl is Pausable {
    /// @dev Emitted when ownership changes
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /// @dev Emitted when any contract setting is updated
    event ContractKnobUpdated(
        string settingName,
        uint256 oldValue,
        uint256 value
    );

    // The addresses of the accounts (or contracts) that can execute actions within each roles.
    address payable public ceoAddress;
    address payable public cfoAddress;
    address payable public cooAddress;

    /// @dev Access modifier for CEO-only functionality
    modifier onlyCEO() {
        require(
            msg.sender == ceoAddress,
            "Only the CEO can perform this action"
        );
        _;
    }

    /// @dev Access modifier for CFO-only functionality
    modifier onlyCFO() {
        require(msg.sender == cfoAddress, "Only CFO can call this function");
        _;
    }

    /// @dev Access modifier for COO-only functionality
    modifier onlyCOO() {
        require(msg.sender == cooAddress, "Only COO can call this function");
        _;
    }

    modifier onlyCLevel() {
        require(
            msg.sender == cooAddress ||
                msg.sender == ceoAddress ||
                msg.sender == cfoAddress,
            "Only CFO, CEO, or COO can call this function"
        );
        _;
    }

    /// @dev Assigns a new address to act as the CEO. Only available to the current CEO.
    /// @param newCEO The address of the new CEO
    function setCEO(address payable newCEO) external onlyCEO {
        require(newCEO != address(0), "CEO cannot be set to the zero address");

        emit OwnershipTransferred(ceoAddress, newCEO);

        ceoAddress = newCEO;
    }

    /// @dev Assigns a new address to act as the CFO. Only available to the current CEO.
    /// @param newCFO The address of the new CFO
    function setCFO(address payable newCFO) external onlyCEO {
        require(newCFO != address(0), "CFO cannot be set to the zero address");

        emit OwnershipTransferred(cfoAddress, newCFO);

        cfoAddress = newCFO;
    }

    /// @dev Assigns a new address to act as the COO. Only available to the current CEO.
    /// @param newCOO The address of the new COO
    function setCOO(address payable newCOO) external onlyCEO {
        require(newCOO != address(0), "COO cannot be set to the zero address");

        emit OwnershipTransferred(cooAddress, newCOO);

        cooAddress = newCOO;
    }

    /// @dev Called by any "C-level" role to pause the contract. Used only when
    ///  a bug or exploit is detected and we need to limit damage.
    function pause() external onlyCLevel whenNotPaused {
        _pause();
    }

    /// @dev Unpauses the smart contract. Can only be called by the CEO, since
    ///  one reason we may pause the contract is when CFO or COO accounts are
    ///  compromised.
    /// @notice This is public rather than external so it can be called by
    ///  derived contracts.
    function unpause() public virtual onlyCEO whenPaused {
        _unpause();
    }
}
