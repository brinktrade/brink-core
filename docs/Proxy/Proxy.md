## `Proxy`



Proxy is deployed for each unique Brink account.

The contract follows a standard "upgradable" pattern. It's fallback function
proxies all calls (via delegatecall) to the contract deployed at the
`implementation` address. For the initial version, `implementation` is
an instance of Account.sol. The `implementation` can be changed only by
`proxyOwner` (aka the Brink user who owns this account).


### `constructor(address implementation, address proxyOwner, uint256 chainId_)` (public)



The constructor sets the `implementation` contract address and the
initial `proxyOwner`. It hashes and stores the "domain separator", a hash
unique to this account that will be used for EIP-712 signed messages.
(https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md).

`chainId_` should match the chain ID where the contract is deployed, but
is not required to. `chainId_` values must differ between testnet and mainnet
deployments, otherwise there may be a scenario where a signed message intended
for a testnet account is also valid on a mainnet account owned by the same user.

### `fallback()` (external)



Fallback function performs a delegatecall to the implementation contract.
This function will return whatever the implementation call returns, or revert
if the implementation call reverts.

### `receive()` (external)






