// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Test/local-demo stand-in for a Tempo TIP-20 stablecoin.
contract MockTIP20 is ERC20 {
    event TransferWithMemo(address indexed from, address indexed to, uint256 amount, bytes32 indexed memo);

    constructor() ERC20("Mock USD", "mUSD") {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function transferWithMemo(address to, uint256 amount, bytes32 memo) external {
        _transfer(msg.sender, to, amount);
        emit TransferWithMemo(msg.sender, to, amount, memo);
    }
}
