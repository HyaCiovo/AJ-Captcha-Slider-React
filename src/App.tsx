import { useEffect, useState } from 'react'
import './App.less'
import AJCaptchaSlider from './components/aj-captcha-slider-react'
import { ConfigProvider, App as AntdApp, ThemeConfig } from 'antd'
import { GithubOutlined } from '@ant-design/icons';

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
    else
      setSize("large")
  };

  useEffect(() => {
    resizeUpdate()
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
          title="Verify Modal"
          tips="Slide the slider to the right"
          refreshText="Refresh"
          show={showCaptcha}
          onSuccess={onSuccess}
          size={size}
          hide={() => setShow(false)}
        />
        <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white flex flex-col items-center p-4 pt-40">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6">
            AJ-Captcha-Slider-React
          </h1>
          <div className="text-sm sm:text-lg md:text-xl pb-10">
            AJ-Captcha-Slider-React is a simple and easy-to-use captcha component for React 🥳.
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 my-10 rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105" onClick={() => setShow(true)}>
            Show Verify Modal
          </button>
          <div className="text-sm text-gray-500 text-center mt-16">
            <span className="mr-2">Made with ❤️ by</span>
            <a href="https://github.com/HyaCiovo" target="_blank" className="hover:underline">
              <GithubOutlined
                style={{ fontSize: "1.4em" }} />
              <span className="text-blue-500 ml-2">HyaCiovo</span>
            </a>
          </div>

        </div>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
