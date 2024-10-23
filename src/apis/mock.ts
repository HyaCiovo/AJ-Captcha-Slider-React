import { aesDecrypt } from "../components/aj-captcha-slider-react/utils";
import mockCaptchaData from "./mockDB";

export type CaptchaRes = {
  token: string;
  secretKey: string;
  originalImageBase64: string;
  jigsawImageBase64: string;
};

/**
 * 异步获取验证码图片
 *
 * 本函数通过发送HTTP请求获取验证码图片数据，并返回解析后的数据
 * 主要用于在用户登录或注册时获取验证码图片，以提高系统安全性
 *
 * @returns {Promise<CaptchaRes>} 返回一个Promise，解析后包含验证码图片数据的CaptchaRes对象
 */
export const getPicture = async (): Promise<CaptchaRes> => {
  const delay = Math.random() * 800;
  return new Promise<CaptchaRes>((resolve) => {
    setTimeout(() => {
      // 模拟异步请求返回的数据
      const keys = Object.keys(mockCaptchaData);
      const key = keys[Math.floor(Math.random() * keys.length)];
      const obj = mockCaptchaData[key];
      resolve({
        token: obj.token,
        secretKey: obj.secretKey,
        originalImageBase64: obj.originalImageBase64,
        jigsawImageBase64: obj.jigsawImageBase64,
      });
    }, delay);
  });
};

export type CheckCaptchaRes = {
  success: boolean;
  msg: string;
  token: string;
};
/**
 * 验证验证码的正确性
 *
 * @param data 包含验证码相关信息的对象
 * @param data.token 验证码的令牌
 * @param data.captchaType 验证码的类型
 * @param data.pointJson 用户点击的位置信息，加密后的内容
 * @param data.clientUid 客户端的唯一标识
 * @param data.ts 时间戳
 * @returns 返回一个Promise，包含验证码验证的结果
 */
export const checkCaptcha = async (data: {
  token: string;
  captchaType: string;
  pointJson: string;
  clientUid: string;
  ts: number;
}): Promise<CheckCaptchaRes> => {
  // 生成随机延迟时间，模拟网络延迟
  const delay = Math.random() * 1500;
  // 定义误差范围，用于验证点击位置，不要过小或者过大，推荐范围在1到3之间
  const buffer = 2;

  return new Promise<CheckCaptchaRes>((resolve, reject) => {
    // 使用setTimeout模拟异步验证过程
    setTimeout(() => {
      if (data.token in mockCaptchaData) {
        const mockCaptchaRes = mockCaptchaData[data.token];
        const x = mockCaptchaRes.x;

        // 解密用户点击的位置信息
        const decryptRes = aesDecrypt(data.pointJson, mockCaptchaRes.secretKey);
        const point = JSON.parse(decryptRes);

        console.log({ captchaX: x, buffer, sliderX: point.x });

        // 验证点击位置是否在有效范围内
        if (!point.x || point.x > x + buffer || point.x < x - buffer) {
          reject("point error");
          return;
        }

        // 模拟异步请求返回的数据
        resolve({ token: mockCaptchaRes.token, success: true, msg: "success" });
        return;
      }
      reject("token error");
    }, delay);
  });
};
