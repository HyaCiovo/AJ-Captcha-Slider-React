export type CaptchaRes = {
  token: string;
  secretKey: string;
  backImgBase: string;
  blockBackImgBase: string;
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
  // 发送GET请求到指定API端点获取验证码图片数据
  return await fetch("/api/captcha/getPicture")
    .then((res) => res.json())
    .then((res) => {
      // 解析响应数据并返回具体的验证码图片数据
      return res.data;
    });
};

export type CheckCaptchaRes = {
  success: boolean;
  msg: string;
};
export const checkCaptcha = async (data: {
  token: string;
  captchaType: string;
  pointJson: string;
  clientUid: string;
  ts: number;
}): Promise<{ token: string }> => {
  // 发送POST请求到指定API端点进行验证码校验
  return await fetch("/api/captcha/checkCaptcha", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((res) => {
      return res.data;
    });
};
