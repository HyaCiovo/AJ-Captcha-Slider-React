# AJ-Captcha-Slider-React



## 介绍

`AJCaptcha-Slider` 是一个基于 [anji-plus/captcha](https://github.com/anji-plus/captcha) 实现的`React`滑块验证码组件，用于验证用户身份。该组件通过显示一张带有缺失部分的图片，并要求用户将缺失部分拖动到正确位置来完成验证。

> **注意：**
>
> **本项目所有图片与验证是由前端`mock`生成，后端接口请参考`AJ-Captcha`的服务端代码**🫡
>
> **GitHub：**https://github.com/anji-plus/captcha
>
> **Gitee：**https://gitee.com/anji-plus/captcha



## 原理

1. 前端获取用于验证的令牌`token`、用于加密的密钥`secretKey`、原始图片的Base64编码`originalImageBase64`和滑动验证码图片的Base64编码`jigsawImageBase64`等数据。

   ```typescript
   /**
    * 定义验证码响应类型
    * 该类型用于表示验证码服务返回的数据结构
    */
   export type CaptchaRes = {
     /** 用于验证的令牌 */
     token: string;
     /** 用于加密的密钥 */
     secretKey: string;
     /** 原始图片的Base64编码 */
     originalImageBase64: string;
     /** 滑动验证码图片的Base64编码 */
     jigsawImageBase64: string;
   };
   ```

2. 通过`AJCaptcha-Slider`得到滑动过后的滑块坐标`point`，因为只是横向滑动，所以只需要使用横坐标`x`。

3. 前端将`token`、经过`secretKey`加密的坐标信息和其他需要的参数上传到服务端进行对比。

4. 服务端解密坐标信息并比对，返回比对结果。





## 效果

1. 验证失败，刷新验证图片：

   <img src="./docs/fail.gif" alt="img"  style="height:350px; width=450px" />

2. 手动刷新验证图片：

   <img src="./docs/refresh.gif" alt="img"  style="height:350px; width=600px"  />

3. 验证成功，关闭模态框：

   <img src="./docs/check.gif" alt="img" style="height:350px; width=400px" />



## 在线体验

**线上体验的数据为前端`mock`生成**

[AJ-Captcha-React (aj-captcha-slider-react.vercel.app)](https://aj-captcha-slider-react.vercel.app/)



## 主要特性

- **动态加载**：组件会动态加载验证码图片和相关数据；
- **自定义样式**：支持自定义图片大小、滑块宽度、内边距等样式属性；
- **多种图标状态**：根据验证状态显示不同的图标（如成功、失败、加载中等）；
- **用户提示**：在不同状态下显示相应的提示信息，引导用户完成操作；
- **适配移动端**：同时支持PC与移动端浏览器操作。



## 基本用法

```typescript
import React from 'react';
import AJCaptchaSlider from './path/to/AJCaptchaSlider';

const App = () => {
  const [show, setShow] = React.useState(false);

  const handleSuccess = (secret: string) => {
    console.log('Verification successful:', secret);
  };

  const handleClose = () => {
    setShow(false);
  };

  return (
    <div>
      <button onClick={() => setShow(true)}>Show Captcha</button>
      <AJCaptchaSlider
        show={show}
        hide={handleClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default App;
```





## API

### Props

| 属性名           | 类型                                                        | 默认值                                           | 描述                                         |
| :--------------- | :---------------------------------------------------------- | :----------------------------------------------- | :------------------------------------------- |
| show             | boolean                                                     | false                                            | 控制验证码弹窗的显示与隐藏                   |
| size             | 'default' \| 'big' \| 'large'                               | 'default'                                        | 验证码组件的尺寸                             |
| vSpace           | number                                                      | 18                                               | 图片与滑块的距离，单位`px`                   |
| sliderBlockWidth | number                                                      | 45                                               | 滑块宽度，单位`px`                           |
| padding          | number                                                      | 16                                               | 弹框内边距，单位`px`                         |
| hide             | () => void                                                  | -                                                | 关闭验证码弹窗的回调函数                     |
| onSuccess        | (secret: string) => void                                    | -                                                | 验证成功后的回调函数，参数为加密后的 `token` |
| setSize          | { imgWidth: number; imgHeight: number; barHeight: number; } | { imgWidth: 310, imgHeight: 155, barHeight: 36 } | 设置图片和滑块的高度和宽度                   |
| title            | string                                                      | -                                                | 弹窗标题                                     |
| tips             | string                                                      | -                                                | 滑块提示文案                                 |
| refreshText      | string                                                      | -                                                | 刷新按钮的文本                               |



### Functions

#### refresh()

刷新验证码数据和界面状态。

#### closeBox()

关闭验证码弹窗。





## 内部逻辑

1. **数据加载**：
   - 组件首次显示时，调用 `getData` 方法从服务器获取验证码图片和相关数据。
   - 加载过程中显示加载动画。
2. **滑块操作**：
   - 用户点击滑块开始拖动时，记录拖动状态。
   - 在拖动过程中，实时更新滑块的位置和提示信息。
   - 拖动结束后，检查滑块位置是否正确，并调用 `checkCaptcha` 方法验证。
3. **验证结果处理**：
   - 验证成功时，显示成功图标和提示信息，并调用 `onSuccess` 回调函数。
   - 验证失败时，显示失败图标和提示信息，并重新加载验证码。
4. **刷新功能**：
   - 提供刷新按钮，允许用户重新加载验证码。



## 样式类

- **`verifybox`**: 主容器类，用于包裹整个验证码组件。
- **`verify-img-out`**: 图片外层容器类，用于设置图片的外边距。
- **`verify-img-panel`**: 图片面板类，用于显示验证码图片。
- **`verify-bar-area`**: 滑块区域类，用于设置滑块的移动范围。
- **`verify-left-bar`**: 左侧滑块条类，用于显示滑块的移动轨迹。
- **`verify-move-block`**: 滑块类，用户拖动的部分。
- **`verify-sub-block`**: 滑块内部的小图块，显示缺失部分的图片。
- **`verify-very-bottom`**: 底部容器类，用于放置刷新按钮。
- **`verify-refresh`**: 刷新按钮类，用于重新加载验证码。



## 依赖库

- **React**: 用于构建组件。
- **antd**: 提供模态框、消息和骨架屏等 UI 组件。
- **@ant-design/icons**: 提供图标组件。



## 工具代码

- **aesEncrypt**: 用于加密验证码数据；
- **aesDecrypt**: 用于在服务端解密验证码数据；
- **uuid**: 用于生成随机的 UUID；
- **setStyle**: 用于设置元素的样式。



## 注意事项

> - 确保在使用该组件前已安装并配置好所有依赖库。
> - 组件内部使用了本地存储来保存一些临时数据，如 `localStorage` 中的 `slider` 键。

希望以上介绍能帮助你更好地理解和使用 `AJCaptchaSlider` 组件。如果有任何问题或建议，请随时联系zhujiruo@foxmail.com。
