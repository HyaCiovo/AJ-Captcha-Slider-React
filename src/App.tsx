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
    borderRadius: 12
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
        <div className="relative min-h-screen bg-linear-to-b from-blue-100 to-white flex flex-col items-center justify-center p-4">
          {/* Background pattern */}
          <div className="absolute inset-0 z-0 opacity-50">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Decorative floating elements */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"
                style={{
                  backgroundColor: `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.3)`,
                  width: `${Math.random() * 10 + 5}rem`,
                  height: `${Math.random() * 10 + 5}rem`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>

          <div className="z-10 text-center flex flex-col items-center">
            <h1 className="title text-2xl sm:text-3xl md:text-4xl lg:text-6xl select-none hover:scale-105 transform duration-300
            font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 mb-6">
              AJ-Captcha-Slider-React
            </h1>
            <div className="select-none text-sm sm:text-lg md:text-xl pb-10 max-w-[70vw] hover:scale-105 transform duration-300">
              A simple and easy-to-use captcha component for React 🥳.
            </div>
            <button className="font-semibold bg-linear-to-r from-blue-500 to-purple-500 hover:from-blue-600 
            hover:to-purple-600 text-white py-3 px-6 my-10 rounded-xl 
            shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:rotate-3
            focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
              onClick={() => setShow(true)}>
              Show Verify Modal
            </button>
            <div className="text-sm text-gray-500 text-center mt-16 select-none  hover:scale-105 transform duration-300">
              <span className="mr-2">Made with ❤️ by</span>
              <a href="https://github.com/HyaCiovo" target="_blank" className="hover:underline">
                <GithubOutlined
                  style={{ fontSize: "1.4em" }} />
                <span className="text-blue-500 ml-2">HyaCiovo</span>
              </a>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-50" />
          <div className="absolute bottom-10 right-10 w-16 h-16 bg-purple-300 rounded-lg animate-bounce opacity-50" />
          <div className="absolute top-1/4 right-1/4 w-12 h-12 bg-yellow-300 rounded-full opacity-50" />
        </div>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
