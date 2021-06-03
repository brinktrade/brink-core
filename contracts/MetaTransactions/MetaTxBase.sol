// SPDX-License-Identifier: MIT

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "../Proxy/ProxyGettable.sol";

/**
 * @dev Base functionality for meta transaction execution.
 *
 * Includes a replay protection solution adapted from "BitFlip" . This is a highly gas
 * efficient technique to prevent replay attacks. Unlike solutions that use an incrementing
 * "nonce" value, BitFlip allows messages to be signed and executed in any order.
 * (https://github.com/anydotcrypto/metatransactions/blob/0547b4e6e9e3356e0a123ecca9fef244e83fca8f/src/contracts/account/ReplayProtection.sol)
 *
 * BitFlip can store up to 256 transaction "bits" in a bytes32 storage slot. `bitmapIndex`
 * indicates the index of the bytes32 storage slot. The value of `bit` is state of the
 * storage slot at this index, defined as a uint256. Bitwise operators are used to ensure
 * that only one bit is flipped per transaction, and to ensure that the bit has not already
 * been flipped. It's gas efficient because overwriting an existing bytes32 slot is cheaper
 * than writing to a new one. BitFlip lets us write to the same slot for 256 separate
 * transactions.
 *
 */
contract MetaTxBase is ProxyGettable {
  using SafeMath for uint256;

  /**
   * @dev Returns a boolean indicating if the given bit is "flipped".
   *
   * Requirements:
   *
   * - `bit` cannot be zero
   * - `bit` must represent a single bit
   */
  function replayProtectionBitUsed(uint256 bitmapIndex, uint256 bit) public view returns (bool used) {
    require(bit > 0, "MetaTxBase.replayProtectionBitUsed: bit cannot be zero");

    // n & (n-1) == 0, i.e. is it a power of two?
    // example: 4 = 100, 3 = 011. 4 & 3 = 000.
    require(bit & bit-1 == 0, "MetaTxBase.replayProtectionBitUsed: bit must be a single bit");

    used = _bitIsUsed(getReplayProtectionBitmap(bitmapIndex), bit);
  }

  /**
   * @dev Returns the replay protection bitmap at the given `bitmapIndex`
   */
  function getReplayProtectionBitmap(uint256 bitmapIndex) public view returns (uint256 bitmap) {
    bytes32 replayProtectionPtr = _getReplayProtectionPtr(bitmapIndex);
    assembly {
      bitmap := sload(replayProtectionPtr)
    }
  }

  /**
   * @dev Returns a boolean indicating if `bit` in the given `bitmap` is "flipped"
   */
  function _bitIsUsed(uint256 bitmap, uint256 bit) internal pure returns (bool used) {
    // This is an AND operation, so if bitmap and the
    // bit share no common "1" bits,
    // then it will be 0. We require bit > 0,
    // to ensure there is always a bit to flip.
    return bitmap & bit != 0;
  }

  /**
   * @dev Returns a storage pointer to the given `bitmapIndex`
   */
  function _getReplayProtectionPtr (uint256 bitmapIndex) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked("replayProtectionBitmaps", bitmapIndex));
  }

  /**
   * @dev Replay protection check and signature recovery for meta transaction execution.
   *
   * Returns the address recovered from the given `dataHash` and `signature`.
   * Signed messages implement the EIP-712 standard.
   * (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md)
   *
   * IMPORTANT: This function does not verify the signer, or the validity of the dataHash.
   * Functions that use `_metaTx` must properly encode `dataHash` and securely verify the
   * returned signer address.
   *
   * Requirements:
   *
   * - `bit` cannot be zero
   * - `bit` must represent a single bit
   * - `bit` on the given `bitmapIndex` cannot be "flipped" (no replays allowed)
   */
  function _metaTx(uint256 bitmapIndex, uint256 bit, bytes32 dataHash, bytes memory signature) internal returns (address signer) {
    require(bit > 0, "MetaTxBase: bit cannot be zero");

    // n & (n-1) == 0, i.e. is it a power of two?
    // example: 4 = 100, 3 = 011. 4 & 3 = 000.
    require(bit & bit-1 == 0, "MetaTxBase: bit must be a single bit");

    // load the bitmap at `bitmapIndex` and verify that `bit` is not "flipped"
    uint256 bitmap;
    bytes32 replayProtectionPtr = _getReplayProtectionPtr(bitmapIndex);
    assembly {
      bitmap := sload(replayProtectionPtr)
    }
    require(!_bitIsUsed(bitmap, bit), "MetaTxBase: bit is used");

    // add the flipped bit to the stored bitmap
    uint256 newBitmap = bitmap | bit;
    assembly {
      sstore(replayProtectionPtr, newBitmap)
    }

    // generate the hash for the signed message
    bytes32 message = keccak256(abi.encodePacked(
      "\x19\x01",
      _domainSeparator(),
      dataHash
    ));

    // recover the signer address from the signed message and return
    signer = ECDSA.recover(message, signature);
  }
}
