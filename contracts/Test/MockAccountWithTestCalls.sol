// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./MockAccount.sol";
import "./TestAccountCalls.sol";

abstract contract MockAccountWithTestCalls is MockAccount, TestAccountCalls {

}
