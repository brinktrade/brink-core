// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "./MetaTxBase.sol";

/**
 * @dev Logic for meta transaction cancel
 *
 * Not deployed. Extends AccountLogic.sol
 *
 * The function uses a unique "typehash", which is included in the signed message.
 * This ensures that signed message data is executable only by the signed function.
 *
 * `bitmapIndex` and `bit` parameters are used for replay protection. See the
 * "BitFlip" solution https://github.com/anydotcrypto/metatransactions/blob/0547b4e6e9e3356e0a123ecca9fef244e83fca8f/src/contracts/account/ReplayProtection.sol
 *
 */
contract MetaCancelLogic is MetaTxBase {
  // keccak256("Cancel(uint256 bitmapIndex,uint256 bit)")
  bytes32 internal constant CANCEL_TYPEHASH = 0x6ea01e04ba5a66cf58ef513e0b67fb09b9dc6deb9deef8814f474f282fb7f0c3;

  /**
   * @dev Flips `bitmapIndex` and `bit`. This invalidates any messages signed with
   * this replay protection bit.
   *
   * NOTE: This "meta transaction" can be executed by any address, as long as a valid
   * signature from a proxy owner is provided.
   *
   * Requirements:
   *
   * - `signer` recovered from hashed data and `signature` must be a proxy owner
   *
   */
  function cancel(uint256 bitmapIndex, uint256 bit, bytes memory signature)
    public
  {
    address signer = _metaTx(
      bitmapIndex, bit,
      keccak256(abi.encode(
        CANCEL_TYPEHASH, bitmapIndex, bit
      )),
      signature
    );
    require(_isProxyOwner(signer), "MetaCallLogic: cancel signer is not proxyOwner");
  }
}
