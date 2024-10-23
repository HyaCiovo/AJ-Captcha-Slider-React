import { useState } from 'react'
import './App.less'
import AJCaptcha from './components/aj-captcha-react'
import { ConfigProvider, App as AntdApp } from 'antd'

const AntdTheme = {
  hashed: false,
  token: {
    colorTextBase: "#333",
    fontFamily: "Comic Sans MS",
  },
};
const App = () => {
  const [showCaptcha, setShow] = useState<boolean>(false)

  const onSuccess = (token: string) => {
    console.log(token)
    setShow(false)
  }

  return (
    <ConfigProvider theme={AntdTheme}>
      <AntdApp>
        <AJCaptcha
          show={showCaptcha}
          onSuccess={onSuccess}
          hide={() => setShow(false)}
        />
        <h1>AJ-Captcha-React</h1>
        <div className="card">
          <button onClick={() => setShow(true)}>
            open captcha modal
          </button>
        </div>
        <p className="read-the-docs">
          See component code in `components/aj-captcha-react`
        </p>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App
