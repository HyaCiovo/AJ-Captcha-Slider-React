import { useEffect, useState } from 'react'
import './App.less'
import AJCaptchaSlider from './components/aj-captcha-slider-react'
import { ConfigProvider, App as AntdApp, ThemeConfig } from 'antd'

const AntdTheme: ThemeConfig = {
  hashed: false,
  token: {
    colorTextBase: "#333",
    fontFamily: "Comic Sans MS",
  },
  components: {
    Modal: {
      titleColor: "#333",
      fontWeightStrong: 500
    },
    Message: {
      contentPadding: '12px',
    }
  }
};

const App = () => {
  const [showCaptcha, setShow] = useState<boolean>(false)
  const [size, setSize] = useState<"default" | "large" | "big">("default")

  const resizeUpdate = () => {
    // 通过事件对象获取浏览器窗口的宽度
    const w = window.innerWidth;
    if (w < 480)
      setSize("default")
    else if (w < 980)
      setSize("big")
    else {
      setSize("large")
    }
  };

  useEffect(() => {
    // 页面变化时获取浏览器窗口的大小 
    window.addEventListener('resize', resizeUpdate);

    return () => {
      // 组件销毁时移除监听事件
      window.removeEventListener('resize', resizeUpdate);
    }
  }, [])
  const onSuccess = (token: string) => {
    console.log("token:", token)
    setShow(false)
  }

  return (
    <ConfigProvider theme={AntdTheme}>
      <AntdApp>
        <AJCaptchaSlider
          show={showCaptcha}
          onSuccess={onSuccess}
          size={size}
          hide={() => setShow(false)}
        />
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center p-4 pt-56">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-10 text-gray-800">
            AJ-Captcha-Slider-React
          </h1>
          <button className="text-base my-6" onClick={() => setShow(true)}>
            Show Verify Modal
          </button>
          <div className="text-base py-6">
            See component code in `components/aj-captcha-slider-react`
          </div>
        </div>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
