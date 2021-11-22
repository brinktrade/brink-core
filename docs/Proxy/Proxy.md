## `Proxy`

The contract fallback function proxies will delegatecall all calls to the contract deployed at the
ACCOUNT_IMPLEMENTATION address.

Proxy is deployed for each unique Brink account.



### `fallback()` (external)



Fallback function performs a delegatecall to the ACCOUNT_IMPLEMENTATION contract.
This function will return whatever the ACCOUNT_IMPLEMENTATION call returns, or revert
if the ACCOUNT_IMPLEMENTATION call reverts.

### `receive()` (external)



The proxy account contract must be able to receive ether. 
Contracts that receive Ether directly but do not define a receive Ether function 
or a payable fallback function throw an exception, sending back the Ether.


