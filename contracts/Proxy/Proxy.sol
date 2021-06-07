// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./ProxyConstant.sol";

/**
 * @dev Proxy is deployed for each unique Brink account.
 *
 * The contract follows a standard "upgradable" pattern. It's fallback function
 * proxies all calls (via delegatecall) to the contract deployed at the
 * `implementation` address. For the initial version, `implementation` is
 * an instance of Account.sol. The `implementation` can be changed only by
 * `proxyOwner` (aka the Brink user who owns this account).
 */
contract Proxy is ProxyConstant {
  /**
  * @dev The constructor sets the `implementation` contract address and the
  * initial `proxyOwner`. It hashes and stores the "domain separator", a hash
  * unique to this account that will be used for EIP-712 signed messages.
  * (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md).
  *
  * `chainId_` should match the chain ID where the contract is deployed, but
  * is not required to. `chainId_` values must differ between testnet and mainnet
  * deployments, otherwise there may be a scenario where a signed message intended
  * for a testnet account is also valid on a mainnet account owned by the same user.
  */
  constructor(address implementation, address proxyOwner, uint256 chainId_) {
    bytes32 domainSeparator = keccak256(abi.encode(
      EIP712_DOMAIN_TYPEHASH,
      keccak256("BrinkAccount"), // Proxy contract name
      keccak256("1"), // Proxy contract version
      chainId_,
      address(this)
    ));

    assembly {
      sstore(IMPLEMENTATION_PTR, implementation)
      sstore(OWNER_PTR, proxyOwner)
      sstore(DOMAIN_SEPARATOR_PTR, domainSeparator)
    }
  }

 /**
  * @dev Fallback function performs a delegatecall to the implementation contract.
  * This function will return whatever the implementation call returns, or revert
  * if the implementation call reverts.
  */
  fallback() external payable {
    assembly {
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), sload(IMPLEMENTATION_PTR), 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch result
      case 0 { revert(0, returndatasize()) }
      default { return(0, returndatasize()) }
    }
  }

  receive() external payable { }
}
