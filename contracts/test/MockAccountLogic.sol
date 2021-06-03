// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "../Account/AccountLogic.sol";

contract MockAccountLogic is AccountLogic {

  // keccak256("MockAccountLogic.mockBlockNum") : Storage pointer to mockBlockNum address
  bytes32 internal constant _mockBlockNumPtr = 0x5dc2b8ac29285b2e2e61b837cc8844958991436e57577f14db15ca783a441fc2;

  constructor (CallExecutor callExecutor) AccountLogic(callExecutor) { }

  // override so we can mock the current block number,
  // since mining blocks on ganache is too slow for the tests
  function _getCurrentBlockNum() internal view returns (uint256 mockBlockNum) {
    assembly {
      mockBlockNum := sload(_mockBlockNumPtr)
    }
  }

  function __mockBlockNum(uint256 blockNum) public {
    assembly {
      sstore(_mockBlockNumPtr, blockNum)
    }
  }

  function __mockBitmap(uint256 bitmapIndex, uint256 mockBitmap) public {
    bytes32 ptr = keccak256(abi.encodePacked("replayProtectionBitmaps", bitmapIndex));
    assembly {
      sstore(ptr, mockBitmap)
    }
  }
}