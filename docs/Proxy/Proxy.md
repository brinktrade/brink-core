## `Proxy`



Proxy is deployed for each unique Brink account.

The contract follows a standard "upgradable" pattern. It's fallback function
proxies all calls (via delegatecall) to the contract deployed at the
`implementation` address. For the initial version, `implementation` is
an instance of Account.sol. The `implementation` can be changed only by
`proxyOwner` (aka the Brink user who owns this account).


### `constructor(address implementation, address proxyOwner)` (public)



The constructor sets the `implementation` contract address and the initial `proxyOwner`

### `fallback()` (external)



Fallback function

### `_delegate(address impl)` (internal)



performs a delegatecall to the implementation contract.
This function will return whatever the implementation call returns, or revert
if the implementation call reverts.

### `receive()` (external)






