## `Account`

Deployed once and used by many Proxy contracts as the implementation contract




### `constructor(contract CallExecutor callExecutor, address accessControlOwner, uint256 chainId_)` (public)

This sets state on the canonical Account contract, not the proxies
Proxy contracts read from canonical Account state through their implementation() address


Constructor sets call executor and the owner of ExecutorAccessController


### `externalCall(uint256 value, address to, bytes data)` (external)



Makes a call to an external contract
Only executable directly by the proxy owner


### `delegateCall(address to, bytes data)` (external)



Makes a delegatecall to an external contract


### `metaCall(uint256 value, address to, bytes data, bytes signature)` (external)



Makes a call to an external contract with message data signed by the proxy owner


### `metaDelegateCall(address to, bytes data, bytes signature)` (external)



Makes a delegatecall to an external contract with message data signed by the proxy owner


### `metaPartialSignedDelegateCall(address to, bytes data, bytes signature, bytes unsignedData)` (external)



Makes a delegatecall to an external contract with message data signed by the proxy owner and unsigned data
provided by the executor (msg.sender)



