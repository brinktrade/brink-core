// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.7.6;

import "../Account/Account.sol";

contract MockAccount is Account {

  // keccak256("MockAccount.mockBlockNum") : Storage pointer to mockBlockNum address
  bytes32 internal constant _mockBlockNumPtr = 0x309cc50dd5fa3f2b7dda8552a2789bf8dec0e6e9d7bce3582758e21eab93e630;
  
  constructor (uint256 chainId_) Account(chainId_) {}

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
    bytes32 ptr = keccak256(abi.encodePacked("bmp", bitmapIndex));
    assembly {
      sstore(ptr, mockBitmap)
    }
  }
}
