## `Account`

Deployed once and used by many proxy contracts as the implementation contract. External functions in this
contract are intended to be called by `delegatecall` from proxy contracts deployed by AccountFactory.



### `onlyDelegateCallable()`



Used by external functions to revert if they are called directly on the implementation Account.sol contract


### `constructor()` (public)



Constructor sets immutable constants

### `externalCall(uint256 value, address to, bytes data)` (external)



Makes a call to an external contract
Only executable directly by the proxy owner


### `delegateCall(address to, bytes data)` (external)



Makes a delegatecall to an external contract


### `metaDelegateCall(address to, bytes data, bytes signature, bytes unsignedData)` (external)

WARNING: The `to` contract is responsible for secure handling of the call provided in the encoded
`callData`. If the proxyOwner signs a delegatecall to a malicious contract, this could result in total loss of
their account.

Allows execution of a delegatecall with a valid signature from the proxyOwner. Uses EIP-712
(https://github.com/ethereum/EIPs/pull/712) signer recovery.


### `metaDelegateCall_EIP1271(address to, bytes data, bytes signature, bytes unsignedData)` (external)

WARNING: The `to` contract is responsible for secure handling of the call provided in the encoded
`callData`. If the proxyOwner contract validates a delegatecall to a malicious contract, this could result in
total loss of the account.

Allows execution of a delegatecall if proxyOwner is a smart contract. Uses EIP-1271
(https://eips.ethereum.org/EIPS/eip-1271) signer validation.


### `proxyOwner() → address _proxyOwner` (internal)



Returns the owner address for the proxy


### `receive()` (external)






