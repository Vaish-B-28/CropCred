// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract Counter {
    uint public x;

    event Increment(address indexed sender, uint indexed by);

    /// @notice Returns the current counter value
    function getX() public view returns (uint) {
        return x;
    }

    /// @notice Increments the counter by 1
    function inc() public {
        x++;
        emit Increment(msg.sender, 1);
    }

    /// @notice Increments the counter by a custom value
    /// @param by The amount to increment
    function incBy(uint by) public {
        require(by > 0, "incBy: increment should be positive");
        x += by;
        emit Increment(msg.sender, by);
    }
}
