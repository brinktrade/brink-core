// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "../src/Test/TestAccountCalls.sol";
import "./helpers/TokenFunder.sol";
import "./helpers/BrinkAccountHelper.sol";

contract Account_delegateCall is BrinkAccountHelper, TokenFunder  {

  event MockParamEvent(uint256 mockUint);

  TestAccountCalls _testAccountCalls;

  function setUp () public {
    _selectDefaultFork();
    _testAccountCalls = new TestAccountCalls();
  }

  // success case
  function test_delegateCall_success () public {
    (VmSafe.Wallet memory signer, IAccount account) = _deployTestAccount(0);

    bytes memory eventCall = abi.encodeWithSelector(bytes4(keccak256(bytes("eventTest(uint256)"))), 123);

    vm.expectEmit(address(account));
    emit MockParamEvent(123);
    vm.prank(signer.addr);
    account.delegateCall(address(_testAccountCalls), eventCall);
  }

  // when the account is not called by owner, should revert
  function test_delegateCall_notOwner () public {
    (, IAccount account) = _deployTestAccount(0);
    (VmSafe.Wallet memory badSigner,) = _deployTestAccount(1);

    bytes memory eventCall = abi.encodeWithSelector(bytes4(keccak256(bytes("eventTest(uint256)"))), 123);

    vm.prank(badSigner.addr);
    vm.expectRevert(abi.encodeWithSelector(IAccount.NotOwner.selector, badSigner.addr));
    account.delegateCall(address(_testAccountCalls), eventCall);
  }

  // when the call reverts, delegateCall should revert
  function test_delegateCall_revertedCall () public {
    (VmSafe.Wallet memory signer, IAccount account) = _deployTestAccount(0);

    bytes memory revertCall = abi.encodeWithSelector(TestAccountCalls.revertTest.selector, true);

    vm.prank(signer.addr);
    vm.expectRevert("TestAccountCalls: reverted");
    account.delegateCall(address(_testAccountCalls), revertCall);
  }

  // when called directly on the implementation contract, should revert
  function test_delegateCall_directToImplementation () public {
    IAccount accountImpl = _deployAccountImplementation();

    vm.expectRevert(IAccount.NotDelegateCall.selector);
    accountImpl.delegateCall(address(0), "");
  }

}