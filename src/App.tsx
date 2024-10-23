import { useState } from 'react'
import './App.less'
import AJCaptchaSlider from './components/aj-captcha-slider-react'
import { ConfigProvider, App as AntdApp, ThemeConfig } from 'antd'

const AntdTheme: ThemeConfig = {
  hashed: false,
  token: {
    colorTextBase: "#333",
    fontFamily: "Comic Sans MS",
    fontSize: 18
  },
  components: {
    Modal: {
      titleFontSize: 24,
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
  const [success, setSuccess] = useState<boolean>(false)
  const onSuccess = (token: string) => {
    setSuccess(true)
    console.log("token:", token)
    setShow(false)
  }

  return (
    <ConfigProvider theme={AntdTheme}>
      <AntdApp>
        <AJCaptchaSlider
          show={showCaptcha}
          onSuccess={onSuccess}
          hide={() => setShow(false)}
        />
        <div className="logo">{success ? '😇' : '😈'}</div>
        <h1>AJ-Captcha-Slider-React</h1>
        <div className="card">
          <button onClick={() => setShow(true)}>
            open captcha modal
          </button>
        </div>
        <p className="read-the-docs">
          See component code in `components/aj-captcha-slider-react`
        </p>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
