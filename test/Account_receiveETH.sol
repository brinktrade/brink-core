// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "./helpers/TokenFunder.sol";
import "./helpers/BrinkAccountHelper.sol";

contract Account_receiveETH is BrinkAccountHelper, TokenFunder  {

  function test_receiveETH () public {
    (,IAccount account0) = _deployTestAccount(0);
    _fund("ETH", address(account0), 2 * 10**18);
    assertEq(address(account0).balance, 2 * 10**18);
  }

}