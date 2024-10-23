import CryptoJS from "crypto-js";

const defaultKeyWord = "SwKsGlMEcdPMEhQ2B"

/**
 * 使用AES算法对字符串进行加密
 * 
 * @param word {string} 需要加密的字符串
 * @param keyWord {string} 加密密钥，默认为defaultKeyWord
 * @returns {string} 加密后的字符串
 */
export const aesEncrypt = (word: string, keyWord = defaultKeyWord) => {
  // 将密钥解析为UTF-8编码的字节序列
  const key = CryptoJS.enc.Utf8.parse(keyWord);
  // 将待加密的字符串解析为UTF-8编码的字节序列
  const srcs = CryptoJS.enc.Utf8.parse(word);
  // 使用AES算法在ECB模式和Pkcs7填充下进行加密
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  // 返回加密后的字符串表示
  return encrypted.toString();
};

/**
 * 使用AES算法进行解密
 * 
 * @param encryptedWord {string} 需要解密的密文
 * @param keyWord {string} 解密用的密钥，默认值为 defaultKeyWord
 * @returns {string} 解密后的原文
 */
export const aesDecrypt = (encryptedWord: string, keyWord = defaultKeyWord) => {
  // 将密钥转换为Utf8编码格式
  const key = CryptoJS.enc.Utf8.parse(keyWord);
  
  // 使用AES算法解密密文，使用ECB模式和Pkcs7填充方式
  const decrypted = CryptoJS.AES.decrypt(encryptedWord, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  
  // 将解密后的数据转换为Utf8编码格式的字符串并返回
  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * 生成一个全局唯一标识符（UUID）
 *
 * UUID的格式为xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx，其中：
 * - x表示一个随机的十六进制数字
 * - y表示一个随机的十六进制数字，但其二进制表示的高两位必须是01（确保UUID的版本为4）
 *
 * 此函数使用Math.random生成随机数，并将其转换为十六进制格式以替换UUID模板中的x和y
 * 通过这种方式，可以生成一个随机的、符合UUID标准的唯一标识符
 *
 * @returns {string} 一个随机生成的UUID字符串
 */
export const uuid = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    // 生成一个0到15之间的随机整数
    const r = (Math.random() * 16) | 0;
    // 如果当前字符是x，则直接使用随机数；如果是y，则确保随机数的高两位是01
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    // 将生成的随机数转换为十六进制字符串
    return v.toString(16);
  });
};
