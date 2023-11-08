module.exports.SharuEncryption = (plaintext) => {
  return plaintext
    .split("")
    .map((char) => String.fromCharCode(char.charCodeAt() + 5))
    .join("");
};
module.exports.SharuDecryption = (chipherText) => {
  return chipherText
    .split("")
    .map((char) => String.fromCharCode(char.charCodeAt() - 5))
    .join("");
};
