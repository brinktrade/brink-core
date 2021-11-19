## `Proxy`



Proxy is deployed for each unique Brink account.

The contract follows a standard "upgradable" pattern. It's fallback function
proxies all calls (via delegatecall) to the contract deployed at the
`implementation` address. For the initial version, `implementation` is
an instance of Account.sol. The `implementation` can be changed only by
`proxyOwner` (aka the Brink user who owns this account).


### `constructor(address proxyOwner)` (public)



The constructor sets `proxyOwner`

### `fallback()` (external)



Fallback function performs a delegatecall to the implementation contract.
This function will return whatever the implementation call returns, or revert
if the implementation call reverts.

### `receive()` (external)



The proxy account contract must be able to receive ether. 
Contracts that receive Ether directly but do not define a receive Ether function 
or a payable fallback function throw an exception, sending back the Ether.


