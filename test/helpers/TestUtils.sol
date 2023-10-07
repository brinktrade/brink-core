// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "forge-std/Test.sol";

abstract contract TestUtils is Test {

  uint256 public immutable OCT_2_2023_BLOCK = 18_263_700;

  uint _defaultFork;

  constructor () {
    _defaultFork = vm.createFork(vm.envString("MAINNET_RPC_URL"), OCT_2_2023_BLOCK);
  }

  function _selectDefaultFork () internal {
    vm.selectFork(_defaultFork);
  }
}
