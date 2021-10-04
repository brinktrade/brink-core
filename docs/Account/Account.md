## `Account`

Deployed once and used by many Proxy contracts as the implementation contract




### `constructor(uint256 chainId_)` (public)



Constructor sets immutable constants

### `storageLoad(bytes32 ptr) → bytes32 data` (external)



Loads bytes32 data stored at the given pointer


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



