## `ProxyGettable`



Exposes proxyOwner() view function for contracts that are intended to receive
delegatecall data from a Proxy instance.


### `proxyOwner() → address _proxyOwner` (public)

When run by a Proxy.sol delegatecall, this function returns the value of the OWNER constant

Returns the proxy owner address



