// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;
pragma abicoder v1;

import "./MockAccount.sol";
import "./TestAccountCalls.sol";

abstract contract MockAccountWithTestCalls is MockAccount, TestAccountCalls {

}
