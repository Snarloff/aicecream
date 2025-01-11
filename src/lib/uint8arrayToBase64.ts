export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  let binaryString = '';

  for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
  }

  return btoa(binaryString);
}
