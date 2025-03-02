import React, { useEffect, useRef, useState } from 'react';
import { App, Modal, Skeleton } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, DoubleRightOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
// import { getPicture, checkCaptcha, CaptchaRes } from '../../apis/captcha';
import { getPicture, checkCaptcha, CaptchaRes } from '../../apis/mock';
import { aesEncrypt, setStyle, uuid } from './utils';
import './index.less';

const Scale = {
  'default': 1,
  'big': 1.4,
  'large': 1.8
}

interface AJCaptchaSliderProps {
  scale?: number
  size?: 'default' | 'big' | 'large'
  show: boolean
  vSpace?: number
  sliderBlockWidth?: number
  padding?: number
  hide: () => void
  onSuccess: (secret: string) => void
  setSize?: {
    imgWidth: number
    imgHeight: number
    barHeight: number
  }
  title: string
  tips?: string
  refreshText?: string
}

type AJCaptchaIconProps = 'right' | 'fail' | 'loading' | 'check'
const AJCaptchaIcon = (props: { icon: AJCaptchaIconProps }) => {

  const iconStyle: React.CSSProperties = {
    fontSize: '18px',
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
  title,
  tips,
  refreshText,
  size = "default",
  vSpace = 18,  // 图片与滑块的距离，单位px
  sliderBlockWidth = 45, // 滑块宽度45，单位px
  padding = 16, // 弹框内边距 单位px
  hide,
  onSuccess,
  setSize = {
    imgWidth: 310, // 图片宽度
    imgHeight: 155, // 图片高度
    barHeight: 36, // 滑块框高度
  }
}) => {
  const scale = Scale[size];
  const blockWidth = sliderBlockWidth * scale;
  const imgWidth = setSize.imgWidth * scale;
  const imgHeight = setSize.imgHeight * scale;

  const isSupportTouch = 'ontouchstart' in window;
  const events = isSupportTouch
    ? {
      start: 'touchstart',
      move: 'touchmove',
      end: 'touchend'
    }
    : {
      start: 'mousedown',
      move: 'mousemove',
      end: 'mouseup'
    };

  const [isLoading, setLoading] = useState<boolean>(false); // 是否加载
  const [response, setResponse] = useState<CaptchaRes | null>(null); // token、密钥、图片等数据
  const [icon, setIcon] = useState<AJCaptchaIconProps>('loading'); // 滑块icon
  const [showTips, setTips] = useState<boolean>(true); // 是否展示提示文案
  const [blockPressed, setPressed] = useState<boolean>(false); // 滑块是否被按下

  const barAreaRef = useRef({
    barAreaLeft: 0,
    barAreaOffsetWidth: 0
  })
  const leftBarRef = useRef<HTMLDivElement>(null)

  const isEnd = useRef<boolean>(false);
  const status = useRef<boolean>(false);

  const { message } = App.useApp();

  useEffect(() => {
    if (!localStorage.getItem("slider"))
      localStorage.setItem("slider", `slider-${uuid()}`);

    // 清理函数
    return () => {
      if (localStorage.getItem("slider"))
        localStorage.removeItem("slider");
      document.removeEventListener(events.move, move as any);
      document.removeEventListener(events.end, end);
      document.removeEventListener('touchcancel', end);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // 重置状态，准备下一次交互
    isEnd.current = false;
    status.current = false;

    // 设置提示信息，指导用户进行下一步操作
    setTips(true);
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
    // 更新状态
    barAreaRef.current = {
      barAreaLeft: newBarAreaLeft, // 记录栏区域的左边界
      barAreaOffsetWidth: newBarAreaOffsetWidth // 记录栏区域的宽度
    }
  }

  const start = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (isEnd.current)
      return;
    status.current = true;
    setPressed(true);

    document.addEventListener(events.move, move as any);
    document.addEventListener(events.end, end);
    document.addEventListener('touchcancel', end);
    e.stopPropagation()
  }

  /**
   * 处理滑动事件的方法，用于更新滑动块的位置和相关的状态
   * @param e React的鼠标点击事件或触摸事件对象
   */
  const move = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    // 如果当前状态不允许滑动或滑动已结束，则直接返回，不执行后续操作
    if (!status.current || isEnd.current) return;

    // 根据事件类型（触摸或鼠标）获取滑动的x坐标
    const x = 'touches' in e ? e.touches[0].pageX : e.clientX

    // 计算滑动块可以移动的最大左边距
    const maxLeft = barAreaRef.current.barAreaOffsetWidth - blockWidth

    // 根据滑动位置计算滑动块的实际左边距，确保它在允许的范围内
    const moveBlockLeft = Math.max(0, Math.min(x - barAreaRef.current.barAreaLeft - blockWidth / 2, maxLeft))

    // 拖动后小方块的left值
    const left = Math.max(0, moveBlockLeft);

    // 计算对应leftBar的width值
    const width = `${left + blockWidth}px`

    // 设置提示信息为空，表示滑动操作正常进行，无错误或额外信息需要展示
    setTips(false);

    // 设置leftBar的width值
    setStyle(leftBarRef.current, { width })
  }
  const end = () => {
    document.removeEventListener(events.move, move as any);
    document.removeEventListener(events.end, end);
    document.removeEventListener('touchcancel', end);
    // 判断是否重合
    if (status.current && !isEnd.current) {
      setIcon('loading')

      const leftBarWidth = parseInt(
        (leftBarRef.current?.style.width || '').replace('px', '')
      )

      const rawPointJson = JSON.stringify({
        x: (leftBarWidth - blockWidth) / scale, // 计算x轴偏移量
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
          isEnd.current = true
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
          isEnd.current = true
          setIcon('fail')
          message.error('Verification failed!')
          setTimeout(() => {
            refresh()
          }, 800)
        })
      status.current = false;
      setPressed(false);
    }
  }

  const closeBox = () => {
    setResponse(null)
    hide?.()
  }

  return (
    <Modal
      title={title}
      className='captcha-modal'
      centered
      open={show}
      maskClosable={false}
      width={imgWidth + 2 * padding}
      styles={{
        content: {
          padding: `16px ${padding}px 10px`,
          userSelect: 'none',
        }
      }}
      footer={null}
      onCancel={closeBox}
    >
      <div className="verifybox">
        {isLoading ?
          <div
            style={{
              width: imgWidth,
            }}>
            <div
              className="verify-img-out"
              style={{ height: imgHeight + vSpace }}
            >
              <Skeleton.Image active
                style={{ height: imgHeight, width: imgWidth }} />
            </div>
            <Skeleton.Node active
              style={{ height: setSize.barHeight, width: imgWidth }}
            />
          </div>
          :
          <div>
            <div
              className="verify-img-out"
              style={{ height: imgHeight + vSpace }}
            >
              <div
                className="verify-img-panel"
                style={{
                  width: imgWidth,
                  height: imgHeight
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
                width: imgWidth,
                height: setSize.barHeight
              }}
              ref={(bar) => setBarArea(bar)}
            >
              <div
                className="verify-msg"
                style={{
                  lineHeight: setSize.barHeight + 'px',
                  marginLeft: blockWidth + 'px',
                  width: imgWidth - blockWidth + 'px',
                  display: showTips ? 'block' : 'none'
                }}
              >
                {tips}
              </div>
              <div
                className="verify-left-bar"
                ref={leftBarRef}
                style={{
                  width: blockWidth,
                  height: setSize.barHeight,
                  touchAction: 'pan-y'
                }}
              >
                <div
                  className="verify-move-block"
                  onMouseDown={start}
                  onTouchStart={start}
                  style={{
                    width: blockWidth,
                    backgroundColor: blockPressed ? '#f2f2f2' : '#fff',
                    cursor: blockPressed ? 'grab' : 'pointer',
                    height: setSize.barHeight - 2,
                  }}
                >{<AJCaptchaIcon icon={icon} />}
                  <div
                    className='verify-sub-block'
                    style={{
                      width: blockWidth,
                      height: imgHeight,
                      top: `-${imgHeight + vSpace}px`,
                      backgroundSize: `${imgWidth} ${imgHeight}`
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
          </div>}
        <div className="verify-very-bottom">
          <div
            className="verify-refresh"
            onClick={refresh}
          >
            <ReloadOutlined spin={isLoading} />
            <span className='verify-refresh-text'>{refreshText}</span>
          </div>
        </div>
      </div>
    </Modal>)
};

export default AJCaptchaSlider;