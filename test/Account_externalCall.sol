// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "./helpers/TokenFunder.sol";
import "./helpers/BrinkAccountHelper.sol";

contract Account_externalCall is BrinkAccountHelper, TokenFunder  {

  // success case
  function test_externalCall_success () public {
    (VmSafe.Wallet memory sender, IAccount senderAcct) = _deployTestAccount(0);
    (VmSafe.Wallet memory recipient, ) = _deployTestAccount(1);
    _fund("WETH", address(senderAcct), 2 * 10**18);
    
    bytes memory erc20TransferCall = abi.encodeWithSelector(IERC20.transfer.selector, recipient.addr, 1 * 10**18);

    vm.prank(sender.addr);
    senderAcct.externalCall(0, address(WETH), erc20TransferCall);

    assertEq(WETH.balanceOf(recipient.addr), 1 * 10**18);
    assertEq(WETH.balanceOf(address(senderAcct)), 1 * 10**18);
  }

  // sending ETH to recipient by providing 0x for data param, should succeed
  function test_externalCall_sendETH () public {
    (VmSafe.Wallet memory sender, IAccount senderAcct) = _deployTestAccount(0);
    (VmSafe.Wallet memory recipient, ) = _deployTestAccount(1);
    _fund("ETH", address(senderAcct), 2 * 10**18);
    
    vm.prank(sender.addr);
    senderAcct.externalCall(1 * 10**18, recipient.addr, "");

    assertEq(recipient.addr.balance, 1 * 10**18);
    assertEq(address(senderAcct).balance, 1 * 10**18);
  }

  // when the account is not called by owner, should revert
  function test_externalCall_notOwner () public {
    (, IAccount senderAcct) = _deployTestAccount(0);
    (VmSafe.Wallet memory recipient, ) = _deployTestAccount(1);
    (VmSafe.Wallet memory badSender, ) = _deployTestAccount(2);
    _fund("WETH", address(senderAcct), 2 * 10**18);
    
    bytes memory erc20TransferCall = abi.encodeWithSelector(IERC20.transfer.selector, recipient.addr, 1 * 10**18);

    vm.expectRevert(abi.encodeWithSelector(IAccount.NotOwner.selector, badSender.addr));
    vm.prank(badSender.addr);
    senderAcct.externalCall(0, address(WETH), erc20TransferCall);
  }

  // when the call reverts, externalCall should revert
  function test_externalCall_revertedCall () public {
    (VmSafe.Wallet memory sender, IAccount senderAcct) = _deployTestAccount(0);
    (VmSafe.Wallet memory recipient, ) = _deployTestAccount(1);
    
    // call to transfer USDC when the account has no USDC
    bytes memory erc20TransferCall = abi.encodeWithSelector(IERC20.transfer.selector, recipient.addr, 150 * 10**6);

    vm.prank(sender.addr);
    vm.expectRevert("ERC20: transfer amount exceeds balance");
    senderAcct.externalCall(0, address(USDC), erc20TransferCall);
  }

  // when called directly on the implementation contract, should revert
  function test_externalCall_directToImplementation () public {
    IAccount accountImpl = _deployAccountImplementation();

    vm.expectRevert(IAccount.NotDelegateCall.selector);
    accountImpl.externalCall(0, address(0), "");
  }

}