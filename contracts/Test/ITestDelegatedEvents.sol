// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

interface ITestDelegatedEvents {
  event ExecutedTestCall();
  event MockParamsEvent(uint256 mockUint, int24 mockInt, address mockAddress);
}
