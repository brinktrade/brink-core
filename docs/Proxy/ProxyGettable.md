## `ProxyGettable`



Exposes getter functions for Proxy.sol and contracts that are intended to receive
delegatecall data from a Proxy instance.


### `implementation() → address` (public)



Returns the implementation address

### `proxyOwner() → address` (public)



Returns the proxy owner address

### `_implementation() → address impl` (internal)



Internal function to read the implementation address

### `_proxyOwner() → address owner` (internal)



Internal function to read the proxy owner address

### `_domainSeparator() → bytes32 domainSeparator` (internal)



Internal function to read the domain separator


