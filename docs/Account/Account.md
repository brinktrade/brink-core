## `Account`

Deployed once and used by many Proxy contracts as the implementation contract




### `constructor(uint256 chainId_)` (public)



Constructor sets CHAIN_ID immutable constant

### `storageLoad(bytes32 ptr) → bytes32 data` (external)



Loads bytes32 data stored at the given pointer


### `externalCall(uint256 value, address to, bytes data)` (external)



Makes a call to an external contract
Only executable directly by the proxy owner


### `delegateCall(address to, bytes data)` (external)



Makes a delegatecall to an external contract


### `metaDelegateCall(address to, bytes data, bytes signature)` (external)



Makes a delegatecall to an external contract with message data signed by the proxy owner


### `metaPartialSignedDelegateCall(address to, bytes data, bytes signature, bytes unsignedData)` (external)



Makes a delegatecall to an external contract with message data signed by the proxy owner and unsigned data
provided by the executor (msg.sender)



