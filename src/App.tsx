import { useState } from 'react'
import './App.css'
import AJCaptcha from './components/aj-captcha'
import { Button } from 'antd'

function App() {
  const [showCaptcha, setShow] = useState<boolean>(false)

  const onSuccess = (token: string) => {
    console.log(token)
    setShow(false)
  }

  return (
    <>
      <AJCaptcha
        show={showCaptcha}
        onSuccess={onSuccess}
        hide={() => setShow(false)}
      />
      <h1>AJ-Captcha-React</h1>
      <h2>函数组件Demo</h2>
      <div className="card">
        <Button type="primary" size="large" onClick={() => setShow(true)}>
          打开验证码弹框
        </Button>
      </div>
      <p className="read-the-docs">
        组件代码详见  `components/aj-captcha`
      </p>
    </>
  )
}

export default App
