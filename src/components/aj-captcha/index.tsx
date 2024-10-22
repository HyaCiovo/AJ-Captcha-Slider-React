import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Skeleton } from 'antd';
import { UndoOutlined, CloseOutlined } from '@ant-design/icons'
import { throttle } from 'lodash-es';
import { getPicture, checkCaptcha, CaptchaRes } from './service'
import { aesEncrypt } from './aes';
import './index.less'

interface AJCaptchaProps {
  show: boolean
  vSpace?: number
  blockWidth?: number
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
  vSpace = 12,
  blockWidth = 48,
  hide,
  onSuccess,
  setSize = {
    imgWidth: 360,
    imgHeight: 155,
    barHeight: 36,
    barWidth: 360
  }
}) => {
  const nodeRef = useRef<HTMLElement | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true); // 是否加载
  const [response, setResponse] = useState<CaptchaRes | null>(null); // token、密钥、图片等数据
  const [icon, setIcon] = useState<string>(''); // 滑块icon
  const [mouseStatus, setMouseStatus] = useState<boolean>(false); // 鼠标状态
  const [isEnd, setEnd] = useState<boolean>(false); // 是否验证结束
  const [tips, setTips] = useState<string>('按住左边按钮拖动完成上方拼图'); // 提示文案
  const [moveBlockLeft, setBlockLeft] = useState<string | null>(null);
  const [leftBarWidth, setLeftBarWidth] = useState<string | null>(null);
  const [barAreaLeft, setBarAreaLeft] = useState<number>(0);
  const [barAreaOffsetWidth, setBarAreaOffsetWidth] = useState<number>(0);

  if (!nodeRef.current) {
    const node = document.createElement('div');
    document.body.appendChild(node);
    nodeRef.current = node;
  }

  useEffect(() => {
    init();
    uuid();

    // 清理函数
    return () => {
      if (nodeRef.current) {
        document.body.removeChild(nodeRef.current);
        nodeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (show)
      refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  /**
   * 初始化鼠标事件监听
   * 该函数主要用于初始化鼠标事件监听器，包括鼠标移动和松开事件
   * 首先移除已存在的事件监听器，然后再重新添加，以确保事件处理函数的唯一性和最新性
   */
  const init = () => {
    // 移除已有的鼠标移动事件监听器，防止重复监听
    window.removeEventListener('mousemove', function (e) {
      move(e)
    })
    // 移除已有的鼠标松开事件监听器，同样防止重复监听
    window.removeEventListener('mouseup', function () {
      end()
    })
    // 添加鼠标移动事件监听器
    window.addEventListener('mousemove', function (e) {
      move(e)
    })
    // 添加鼠标松开事件监听器
    window.addEventListener('mouseup', function () {
      end()
    })
  }

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

    // 重置鼠标状态为false，通常用于表示鼠标不再处于特定的交互状态
    setMouseStatus(false);

    // 重置结束状态为false，表示某个交互或过程尚未完成
    setEnd(false);

    // 设置提示信息，指导用户进行下一步操作
    setTips('按住左边按钮拖动完成上方拼图');

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
    // 获取栏区域左边界的坐标
    const newBarAreaLeft = event?.getBoundingClientRect().left || 0;
    // 获取栏区域的宽度
    const newBarAreaOffsetWidth = event?.offsetWidth || 0;
    // 更新状态，设置栏区域的左边界
    setBarAreaLeft(newBarAreaLeft);
    // 更新状态，设置栏区域的宽度
    setBarAreaOffsetWidth(newBarAreaOffsetWidth);
  }

  const start = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (isEnd)
      return;
    setMouseStatus(true)
    setTips('')
    e.stopPropagation()
  }

  const move = (e: MouseEvent) => {
    if (!mouseStatus || isEnd) return;

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
    if (mouseStatus && !isEnd) {
      const moveLeftDistance = parseInt(
        (moveBlockLeft || '').replace('px', '')
      )

      const rawPointJson = JSON.stringify({
        x: moveLeftDistance,
        y: 5.0
      })

      const data = {
        captchaType: 'blockPuzzle',
        pointJson: response?.secretKey
          ? aesEncrypt(rawPointJson, response?.secretKey)
          : rawPointJson,
        token: response!.token,
        clientUid: localStorage.getItem('slider')!,
        ts: Date.now()
      }

      setIcon('loading')

      checkCaptcha(data)
        .then((res) => {
          setEnd(true)
          setIcon('success')
          setTimeout(() => {
            const params = `${res.token}---${rawPointJson}`
            // console.log(params)
            onSuccess(aesEncrypt(params, response?.secretKey))
            closeBox()
          }, 1000)
        })
        .catch(() => {
          setEnd(true)
          setIcon('fail')
          setTimeout(() => {
            refresh()
          }, 800)
        })
      setMouseStatus(false)
    }
  }

  const closeBox = () => {
    setResponse(null)
    hide?.()
  }


  return createPortal(// 蒙层
    <div className="mask" style={{
      display: show ? 'block' : 'none',
    }}>
      <div className="verifybox"
        style={{ maxWidth: setSize.imgWidth + 48 + "px" }}
      >
        <div className="verifybox-top">
          请完成下列验证后继续：
          <CloseOutlined
            className="verifybox-close"
            onClick={closeBox}
          />
        </div>
        {isLoading && (
          <div className="verifybox-bottom">
            <div style={{ position: 'relative', width: setSize.imgWidth }}>
              <Skeleton.Image active
                style={{ height: setSize.imgHeight, width: setSize.imgWidth }} />
              <Skeleton.Node active
                style={{ height: setSize.barHeight, width: setSize.barWidth, marginTop: vSpace }}
              />
            </div>
          </div>
        )}
        {!isLoading && (
          <div className="verifybox-bottom">
            {/* 验证容器 */}
            <div style={{ position: 'relative' }}>
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
                  {response?.backImgBase && (
                    <img
                      src={'data:image/png;base64,' + response?.backImgBase}
                      alt=""
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'block'
                      }}
                    />
                  )}
                </div>
              </div>

              <div
                className="verify-bar-area"
                style={{
                  width: setSize.barWidth,
                  height: setSize.barHeight
                }}
                ref={(bararea) => setBarArea(bararea)}
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
                      width: `${blockWidth}px`,
                      height: '34px',
                      // backgroundColor: this.state.moveBlockBackgroundColor,
                      left: moveBlockLeft || 0
                    }}
                  >
                    <i className={`verify-icon iconfont icon-${icon}`} />
                    <div
                      className="verify-sub-block"
                      style={{
                        width: `${blockWidth}px`,
                        height: setSize.imgHeight,
                        top: `-${setSize.imgHeight + vSpace}px`,
                        backgroundSize: `${setSize.imgWidth} ${setSize.imgHeight}`
                      }}
                    >
                      {response?.blockBackImgBase && (
                        <img
                          src={
                            'data:image/png;base64,' +
                            response?.blockBackImgBase
                          }
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'block'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="verify-very-bottom">
          <div
            className="verify-refresh"
            onClick={throttle(refresh, 100)}
          >
            <UndoOutlined className="verify-refresh-icon" />
            <span>刷新</span>
          </div>
        </div>
      </div>
    </div>, nodeRef.current!)
};

export default AJCaptcha;