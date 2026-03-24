import QRCode from 'qrcode';

/**
 * Encode wallet address thành QR data URL (PNG base64).
 */
export async function encode(walletAddress) {
  return QRCode.toDataURL(walletAddress, { width: 300, margin: 2 });
}

/**
 * Decode QR data — trong trường hợp này QR chứa trực tiếp wallet address.
 */
export function decode(qrData) {
  return qrData; // wallet address is the raw QR content
}
