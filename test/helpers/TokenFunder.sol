// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity =0.8.10;

import "./TestUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract TokenFunder is TestUtils {

  address WHALE_0 = 0x8EB8a3b98659Cce290402893d0123abb75E3ab28;
  IERC20 public WETH = IERC20(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
  IERC20 public USDC = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

  address ETH_ADDR = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

  struct TestTokenData {
    IERC20 token;
    address whale;
  }

  mapping (string => TestTokenData) _testTokenMap;

  constructor () {
    _testTokenMap['ETH'] = TestTokenData(IERC20(ETH_ADDR), WHALE_0);
    _testTokenMap['WETH'] = TestTokenData(WETH, WHALE_0);
    _testTokenMap['USDC'] = TestTokenData(USDC, WHALE_0);
  }

  function _fund(string memory tokenName, address account, uint amount) internal {
    TestTokenData memory testTokenData = _testTokenMap[tokenName];
    IERC20 token = testTokenData.token;
    if (address(token) == address(0)) {
      revert("TokenFunder: token not found");
    } else if (address(token) == ETH_ADDR) {
      vm.deal(account, amount);
    } else {
      vm.prank(testTokenData.whale);
      token.transfer(account, amount);
    }
  }

}
