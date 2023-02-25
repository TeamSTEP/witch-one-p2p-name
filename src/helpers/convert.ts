import * as polkaUtils from '@polkadot/util';

const MAX_BYTE_SIZE = 32;

/**
 * Converts the given UTF-8 string into a 32 byte hex that can be stored in the blockchain.
 * If the input is less than 32 bytes, it will add 0x00 to the end.
 * @param text UTF-8 string.
 * @returns 32 byte hex string.
 */
export const utf8StringToHex = (text: string) => {
    const encodedString = polkaUtils.hexToU8a(polkaUtils.stringToHex(text).replace('0x', ''));
    const inputByteSize = encodedString.length;

    if (inputByteSize > MAX_BYTE_SIZE) {
        throw new Error(`The provided string is ${inputByteSize} bytes. This function can only handle up to 32 bytes`);
    }

    // add trailing zeros to the hex string so it's exactly 32 bytes
    if (inputByteSize < MAX_BYTE_SIZE) {
        const missingBytes = MAX_BYTE_SIZE - inputByteSize;

        const filler = new Uint8Array(missingBytes).fill(0x00);

        // merging two arrays
        const mergedBytes = new Uint8Array(encodedString.length + filler.length);

        mergedBytes.set(encodedString);
        mergedBytes.set(filler, encodedString.length);

        return polkaUtils.u8aToHex(mergedBytes);
    }

    return polkaUtils.u8aToHex(encodedString);
};

/**
 * Converts the given 32 byte hex string that is stored in the blockchain to a UTF-8 string.
 * This function will treat all 0x00 bytes as an empty entry and remove them before encoding.
 * @param bytes Hex string of a 32 byte hash.
 * @returns Human-readable UTF-8 string.
 */
export const hexToUtf8String = (bytes: string) => {
    if (!polkaUtils.isHex(bytes)) {
        throw new Error(`Provided string ${bytes} is not a proper hex string`);
    }

    const byteArray = polkaUtils.hexToU8a(bytes);
    // todo: remove all trailing 0x00 bytes
    const stringHex = byteArray.filter((i) => i !== 0x00);

    return polkaUtils.u8aToString(stringHex);
};
