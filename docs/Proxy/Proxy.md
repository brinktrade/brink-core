## `Proxy`



Proxy is deployed for each unique Brink account.

The contract follows a standard "upgradable" pattern. It's fallback function
proxies all calls (via delegatecall) to the contract deployed at the
ACCOUNT_IMPLEMENTATION address.


### `constructor(address proxyOwner)` (public)



The constructor sets `proxyOwner`

### `fallback()` (external)



Fallback function performs a delegatecall to the ACCOUNT_IMPLEMENTATION contract.
This function will return whatever the ACCOUNT_IMPLEMENTATION call returns, or revert
if the ACCOUNT_IMPLEMENTATION call reverts.

### `receive()` (external)



The proxy account contract must be able to receive ether. 
Contracts that receive Ether directly but do not define a receive Ether function 
or a payable fallback function throw an exception, sending back the Ether.


