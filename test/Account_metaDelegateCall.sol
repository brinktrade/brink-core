// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "../src/Test/TestAccountCalls.sol";
import "./helpers/BrinkAccountHelper.sol";

contract Account_delegateCall is BrinkAccountHelper  {

  event MockParamEvent(uint256 mockUint);
  event MockParamsEvent(uint256 mockUint, int24 mockInt, address mockAddress);

  TestAccountCalls _testAccountCalls;

  function setUp () public {
    _selectDefaultFork();
    _testAccountCalls = new TestAccountCalls();
  }

  // success case
  function test_metaDelegateCall_success () public {
    (VmSafe.Wallet memory signer, IAccount account) = _deployTestAccount(0);
    (VmSafe.Wallet memory solver,) = _deployTestAccount(1);
    (VmSafe.Wallet memory random,) = _deployTestAccount(2);

    // sign with first 2 params
    bytes memory eventCall = abi.encodeWithSelector(bytes4(keccak256(bytes("eventTest(uint256,int24,address)"))), 123, int24(456));
    bytes memory signature = _signMetaDelegateCall(signer, address(_testAccountCalls), eventCall, 1);

    // solver executes metaDelegateCall with 3rd param, should emit MockParamEvent
    vm.expectEmit(address(account));
    emit MockParamsEvent(123, int24(456), random.addr);
    vm.prank(solver.addr);
    account.metaDelegateCall(address(_testAccountCalls), eventCall, signature, abi.encode(random.addr));
  }

}