import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { App, Skeleton } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CloseOutlined, DoubleRightOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons'
import { getPicture, checkCaptcha, CaptchaRes } from './service'
import { aesEncrypt } from './aes';
import './index.less'

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
const uuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // 生成一个0到15之间的随机整数
    const r = (Math.random() * 16) | 0;
    // 如果当前字符是x，则直接使用随机数；如果是y，则确保随机数的高两位是01
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    // 将生成的随机数转换为十六进制字符串
    return v.toString(16);
  });
};

interface AJCaptchaSliderProps {
  show: boolean
  vSpace?: number
  blockWidth?: number
  padding?: number
  hide: () => void
  onSuccess: (secret: string) => void
  setSize?: {
    imgWidth: number
    imgHeight: number
    barHeight: number
    barWidth: number
  }
}

type AJCaptchaIconProps = 'right' | 'fail' | 'loading' | 'check'
const AJCaptchaIcon = (props: { icon: AJCaptchaIconProps }) => {

  const iconStyle: React.CSSProperties = {
    fontSize: '22px',
    color: '#999'
  }
  switch (props.icon) {
    case 'right':
      return <DoubleRightOutlined style={iconStyle} />
    case 'fail':
      return <CloseCircleOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />
    case 'loading':
      return <LoadingOutlined style={iconStyle} />
    case 'check':
      return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />
  }
}

const AJCaptchaSlider: React.FC<AJCaptchaSliderProps> = ({
  show = false,
  vSpace = 20,  // 图片与滑块的距离，单位px
  blockWidth = 90, // 滑块宽度45 此处*2，单位px
  padding = 32, // 弹框内边距 单位px
  hide,
  onSuccess,
  setSize = {
    imgWidth: 620, // 图片宽度为310px，此处*2
    imgHeight: 310, // 图片高度
    barHeight: 50, // 滑块框高度
    barWidth: 620 // 滑块框宽度，与图片宽度保持一致
  }
}) => {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [isLoading, setLoading] = useState<boolean>(false); // 是否加载
  const [response, setResponse] = useState<CaptchaRes | null>(null); // token、密钥、图片等数据
  const [icon, setIcon] = useState<AJCaptchaIconProps>('loading'); // 滑块icon
  const [tips, setTips] = useState<string>('Drag the left button to complete the puzzle above'); // 提示文案
  const [moveBlockLeft, setBlockLeft] = useState<string | null>(null);
  const [leftBarWidth, setLeftBarWidth] = useState<string | null>(null);
  const [barAreaLeft, setBarAreaLeft] = useState<number>(0);
  const [barAreaOffsetWidth, setBarAreaOffsetWidth] = useState<number>(0);
  const flags = useRef<{ isEnd: boolean, status: boolean }>({
    isEnd: false,
    status: false
  })
  const { message } = App.useApp();

  if (!nodeRef.current) {
    const node = document.createElement('div');
    document.body.appendChild(node);
    nodeRef.current = node;
  }

  useEffect(() => {
    if (!localStorage.getItem("slider"))
      localStorage.setItem("slider", `slider-${uuid()}`);

    // 清理函数
    return () => {
      if (nodeRef.current) {
        document.body.removeChild(nodeRef.current);
        nodeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (show)
      refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  /**
   * 刷新数据和界面状态的函数
   * 此函数主要用于在不加载中的情况下，重新获取数据并重置鼠标状态、结束状态、提示信息和布局宽度
   * 它确保在界面交互过程中，用户界面始终保持一致和响应性
   */
  const refresh = () => {
    // 检查数据加载状态，如果正在加载，则不执行后续操作
    if (isLoading) return;

    // 重新获取数据
    getData();

    // 重置flags状态，准备下一次交互
    flags.current = {
      isEnd: false,
      status: false
    }

    // 设置提示信息，指导用户进行下一步操作
    setTips('Drag the left button to complete the puzzle above');

    // 重置方块左侧位置，以便重新计算或应用默认布局
    setBlockLeft('');

    // 重置左侧栏宽度，以适应界面布局变化或重置布局
    setLeftBarWidth('');
  }

  const getData = () => {
    setLoading(true)
    setIcon('right')
    getPicture()
      .then((res) => {
        setResponse(res)
      })
      .finally(() =>
        setLoading(false)
      )
  }

  /**
   * 设置栏区域的左边界和宽度
   * 此函数通过计算给定HTML元素的位置和尺寸来更新栏区域的左边界和宽度
   * @param event HTMLDivElement类型，代表触发事件的HTML元素它用于获取栏区域的位置和宽度信息
   */
  const setBarArea = (event: HTMLDivElement | null) => {
    if (!event)
      return;
    // 获取栏区域左边界的坐标
    const newBarAreaLeft = event.getBoundingClientRect().left;
    // 获取栏区域的宽度
    const newBarAreaOffsetWidth = event.offsetWidth;
    // 更新状态，设置栏区域的左边界
    setBarAreaLeft(newBarAreaLeft);
    // 更新状态，设置栏区域的宽度
    setBarAreaOffsetWidth(newBarAreaOffsetWidth);
  }

  const start = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (flags.current.isEnd)
      return;
    flags.current.status = true
    e.stopPropagation()
  }

  const move = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!flags.current.status || flags.current.isEnd) return;

    const x = e.clientX

    const maxLeft = barAreaOffsetWidth - blockWidth

    const moveBlockLeft = Math.max(0, Math.min(x - barAreaLeft, maxLeft))
    // 拖动后小方块的left值
    const left = `${Math.max(0, moveBlockLeft)}px`;
    setTips('')
    setBlockLeft(left);
    setLeftBarWidth(left);
  }

  const end = () => {
    // 判断是否重合
    if (flags.current.status && !flags.current.isEnd) {
      const moveLeftDistance = parseInt(
        (moveBlockLeft || '').replace('px', '')
      )

      const rawPointJson = JSON.stringify({
        x: moveLeftDistance / 2,
        y: 5.0
      })

      const data = {
        captchaType: 'blockPuzzle',
        pointJson: response?.secretKey
          ? aesEncrypt(rawPointJson, response?.secretKey)
          : rawPointJson,
        token: response?.token || '',
        clientUid: localStorage.getItem('slider')!,
        ts: Date.now()
      }

      checkCaptcha(data)
        .then((res) => {
          flags.current.isEnd = true
          if (res.token) {
            setIcon('check')
            message.success('Verification successful!')
            setTimeout(() => {
              const params = `${res.token}---${rawPointJson}`
              onSuccess(aesEncrypt(params, response?.secretKey))
              closeBox()
            }, 1000)
          }
          else {
            setIcon('fail')
            message.error('Verification failed!')
            setTimeout(() => {
              refresh()
            }, 800)
          }
        })
        .catch(() => {
          flags.current.isEnd = true
          setIcon('fail')
          message.error('Verification failed!')
          setTimeout(() => {
            refresh()
          }, 800)
        })
      flags.current.status = false
    }
  }

  const closeBox = () => {
    setResponse(null)
    hide?.()
  }


  return createPortal(// 蒙层
    <div className="mask"
      style={{ display: `${show ? 'block' : 'none'}` }}
      onMouseMove={move}
      onMouseUp={end}>
      <div className="verifybox"
        style={{ maxWidth: setSize.imgWidth + 2 * padding + "px" }}
      >
        <div className="verifybox-top">
          Please complete the following verification:
          <CloseOutlined
            className="verifybox-close"
            onClick={closeBox}
          />
        </div>
        <div className="verifybox-bottom">
          {isLoading ?
            <div className="relative"
              style={{
                width: setSize.imgWidth,
              }}>
              <div
                className="verify-img-out"
                style={{ height: setSize.imgHeight + vSpace }}
              >
                <Skeleton.Image active
                  style={{ height: setSize.imgHeight, width: setSize.imgWidth }} />
              </div>
              <Skeleton.Node active
                style={{ height: setSize.barHeight, width: setSize.barWidth }}
              />
            </div>
            :
            <div className="relative">
              <div
                className="verify-img-out"
                style={{ height: setSize.imgHeight + vSpace }}
              >
                <div
                  className="verify-img-panel"
                  style={{
                    width: setSize.imgWidth,
                    height: setSize.imgHeight
                  }}
                >
                  {response?.originalImageBase64 &&
                    <img
                      src={'data:image/png;base64,' + response?.originalImageBase64}
                      alt="captcha-image"
                      draggable={false}
                      className="verify-img"
                    />}
                </div>
              </div>

              <div
                className="verify-bar-area"
                style={{
                  width: setSize.barWidth,
                  height: setSize.barHeight
                }}
                ref={(e) => setBarArea(e)}
              >
                <div
                  className="verify-msg"
                  style={{ lineHeight: setSize.barHeight + 'px' }}
                >
                  {tips}
                </div>
                <div
                  className="verify-left-bar"
                  style={{
                    width:
                      leftBarWidth !== null
                        ? leftBarWidth
                        : setSize.barHeight,
                    height: setSize.barHeight,
                    touchAction: 'pan-y'
                  }}
                >
                  <div
                    className="verify-move-block"
                    onMouseDown={start}
                    style={{
                      width: blockWidth,
                      height: 48,
                      left: moveBlockLeft || '0px'
                    }}
                  >{<AJCaptchaIcon icon={icon} />}
                    <div
                      className='verify-sub-block'
                      style={{
                        width: blockWidth,
                        height: setSize.imgHeight,
                        top: `-${setSize.imgHeight + vSpace}px`,
                        backgroundSize: `${setSize.imgWidth} ${setSize.imgHeight}`
                      }}
                    >
                      {response?.jigsawImageBase64 &&
                        <img
                          src={
                            'data:image/png;base64,' +
                            response?.jigsawImageBase64
                          }
                          alt="blockImage"
                          className="verify-img"
                        />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }

        </div>
        <div className="verify-very-bottom">
          <div
            className="verify-refresh"
            onClick={refresh}
          >
            <ReloadOutlined spin={isLoading} />
            <span className='verify-refresh-text'>refresh</span>
          </div>
        </div>
      </div>
    </div>, nodeRef.current!)
};

export default AJCaptchaSlider;