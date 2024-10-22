import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { App, Skeleton } from 'antd';
import { UndoOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons'
import { throttle } from 'lodash-es';
import { getPicture, checkCaptcha, CaptchaRes } from './service'
import { aesEncrypt } from './aes';
import './index.less'

interface AJCaptchaProps {
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

const AJCaptcha: React.FC<AJCaptchaProps> = ({
  show = false,
  vSpace = 20,  // 图片与滑块的距离，单位px
  blockWidth = 88, // 滑块宽度44 此处*2，单位px
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
  const [icon, setIcon] = useState<string>(''); // 滑块icon
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
    uuid();

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


  // 初始化 uuid
  const uuid = () => {
    // 初始化一个空数组用于存储uuid的各个部分
    const s = [];
    // 定义十六进制数字字符集
    const hexDigits = "0123456789abcdef";
    // 生成uuid的主要部分，共36个字符（包括连字符）
    for (let i = 0; i < 36; i++) {
      // 随机生成十六进制字符并添加到数组中
      s[i] = hexDigits[Math.floor(Math.random() * 0x10)];
    }
    // 设置uuid的版本号为4（时间基于版本）
    s[14] = "4";
    // 设置uuid的变体为2（按照RFC 4122标准）
    s[19] = hexDigits[(parseInt(s[19], 16) & 0x3) | 0x8];
    // 插入连字符，形成标准的uuid格式
    s[8] = s[13] = s[18] = s[23] = "-";

    // 构造特定格式的slider和point字符串
    const slider = "slider" + "-" + s.join("");
    const point = "point" + "-" + s.join("");
    // 检查本地存储中是否存在slider，如果不存在则存储
    if (!localStorage.getItem("slider")) {
      localStorage.setItem("slider", slider);
    }
    // 检查本地存储中是否存在point，如果不存在则存储
    if (!localStorage.getItem("point")) {
      localStorage.setItem("point", point);
    }
  }

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
    setTips('')
    e.stopPropagation()
  }

  const move = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!flags.current.status || flags.current.isEnd) return;

    const x = e.clientX

    const maxLeft = barAreaOffsetWidth - blockWidth

    const moveBlockLeft = Math.max(0, Math.min(x - barAreaLeft, maxLeft))
    // 拖动后小方块的left值
    const left = `${Math.max(0, moveBlockLeft)}px`;

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

      setIcon('loading')

      checkCaptcha(data)
        .then((res) => {
          console.log(res)
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
    <div className={`mask ${!show && 'hidden'}`} onMouseMove={move} onMouseUp={end}>
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
                      className="w-full h-full block rounded"
                    />}
                </div>
              </div>

              <div
                className="verify-bar-area rounded"
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
                  >
                    <i className={`verify-icon icon-${icon}`} />
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
                          className="w-full h-full block"
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
            onClick={throttle(refresh, 100)}
          >
            {isLoading ? <LoadingOutlined className="mr-2" />
              : <UndoOutlined className="mr-2 -rotate-90" />}
            <span>refresh</span>
          </div>
        </div>
      </div>
    </div>, nodeRef.current!)
};

export default AJCaptcha;