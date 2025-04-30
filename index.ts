import puppeteer, {Browser, LaunchOptions, Page} from 'puppeteer'
import type {IProps, OpenPageOptions, Target, obj} from './types.d.ts'

// 把对象数组合成对象
function formatArrToObj (result: obj[]): obj {
  const obj = {}
  result.forEach((item) => {
    Object.assign(obj, item)
  })
  return obj
}

class PupCrawler {
  browser: Browser | undefined
  url: string | undefined
  host: string
  console: boolean
  states: obj
  constructor(props?: IProps) {
    this.browser = undefined
    this.url = undefined
    this.host = props?.host || ''
    this.console = props?.console || false
    this.states = {} // 存放状态数据
  }
  async open(options?: LaunchOptions) {
    this.browser = await puppeteer.launch(options || { protocolTimeout: 60000 })
    this.browser.userAgent()
  }
  async close() {
    await this.browser?.close()
  }
  setValue(key: string, value: any) {
    this.states[key] = value
  }
  getValue(key: string) {
    return this.states[key]
  }

  /** 页面滚动 */
  async scorllToBottom(page: Page, interval: number) {
    await page.evaluate((interval) => {
        const scrollHeight = document.body.scrollHeight
        const viewportHeight = window.innerHeight
        const maxScroll = scrollHeight - viewportHeight
        let currentScroll = window.scrollY
        const handleInterval = setInterval(() => {
            if (currentScroll >= maxScroll) {
                clearInterval(handleInterval)
            } else {
                window.scroll(0, currentScroll + viewportHeight)
            }
        }, interval)
        return [scrollHeight, viewportHeight, maxScroll, handleInterval, currentScroll]
    }, interval)
  }

  /** 循环获取 */
  async loopRun(result: obj, target: Target) {
    type TargetItem = {loopOpt: OpenPageOptions, label: string}
    const { loopOpt, label: loopAttr } = target.values?.find((item) => item?.loopOpt) || {} as TargetItem
    if (loopAttr && loopOpt) {
      const links = typeof result[loopAttr] === 'string' ? [result[loopAttr]] : result[loopAttr]
      this.console && console.log('loopOpt =>> ', links)
      const looplist = []
      for await (let link of links) {
        const loopResult = await this.openPage({ ...loopOpt, url: link })
        looplist.push(loopResult)
      }
      result[loopAttr] = looplist
    }
    return result
  }

  /** 自循环 */
  async recursionRun(result: obj, options: OpenPageOptions) {
    const { target, name, delayTime, recursion } = options
    const { loopKey, loopVals = [] } = recursion || {}
    if (loopKey) {
      const links = result[loopKey] || []
      const resArr = []
      // 多个循环
      if (links.length > 1) {
        for await (let link of links) {
          // 递归不能要recursion，否则从第一开始, 和callback要处理和返回对象那个一致
          const loopRes = await this.openPage({ url: link, target, name, delayTime })
          if (!loopRes || !Object.keys(loopRes).length) continue
          const tempObj: obj = {}
          loopVals.forEach((attr) => {
            tempObj[attr] = loopRes[attr]
          })
          resArr.push(tempObj)
        }
        result[loopKey] = resArr
      } else if (links.length === 1) {
        // 如果只有一个值，前面就以及处理了
        const tempObj = {} as obj
        loopVals.forEach((attr) => {
          tempObj[attr] = result[attr]
        })
        result[loopKey] = [tempObj]
      }
    }
    return result
  }

  /** 爬取页面属性：PipePageOptions */
  async openPage(params: OpenPageOptions): Promise<obj> {
    const { name = 'default', url, target, autoScroll=false, autoScrollInterval=500, timeout = 60000, callback, before, after, delayTime = 0 } = params

    this.url = url?.includes(this.host) ? url : this.host + url
    // 前置函数
    const beforeFlag = before ? await before?.() : true
    if (!beforeFlag) return {}// 中断后续操作

    const page = await this.browser?.newPage()
    if (!page) return {}

    try {
      this.console && console.log(`${name} =>> `, this.url)
      await page.goto(this.url, { timeout: timeout, waitUntil: 'networkidle2' })

      // 延迟 delayTime /1000 秒
      delayTime > 0 && (await new Promise((resolve) => setTimeout(resolve, delayTime)))

      // 等待元素加载
      target?.waitCss && (await page.waitForSelector(target.waitCss)) 

      // 自动滚动
      if (autoScroll) {
        await this.scorllToBottom(page, autoScrollInterval)
      }
     
      const result: Array<obj>  = await page.evaluate(({ values = [] }) => {
        if (!values.length) return []
        return values.map(({ css, all = false, attr, label, allIdx }) => {
          // 0、可能直接执行命令
          if (attr?.startsWith('window.')) {
            return { [label]: window.eval(attr) }
          }

          // 1、如果没有css选择器，则返回空
          if (!css) return 

          const [mainCss, subCss] = typeof css === 'string' ? [css] : css
          const elements = document.querySelectorAll(mainCss) || []

          // 2、单个查询
          if (!all) {
            let el = elements[0]
            el = subCss ? el.querySelector(subCss) || el : el // 如果子选择器没有，则取父元素
            const text = attr ? el?.getAttribute(attr) : el?.textContent?.trim()
            return { [label]: text }
          }

          // 3、多个查询
          if (all) {
            if (allIdx !== undefined) {
              // 有index
              const idx = allIdx < 0 ? elements.length + allIdx : allIdx
              const el = elements[idx]
              // 3.1、有index && 没有子选择器：=>则取元素的值
              if (!subCss) {
                const text = attr ? el?.getAttribute(attr) : el?.textContent?.trim()
                return { [label]: text }
              } else {
                // 3.2、有index && 有子选择器：=> 则取子元素的值
                const els = el.querySelectorAll(subCss) || []
                const subVals = []
                for (let i = 0; i < els.length; i++) {
                  const sel = els[i]
                  const text = attr ? sel?.getAttribute(attr) : sel?.textContent?.trim()
                  subVals.push(text)
                }
                return { [label]: subVals }
              }
            }

            // 3.3、没有index && all： => 返回所有
            const vals = []
            for (let i = 0; i < elements.length; i++) {
              const el = elements[i]
              const text = attr ? el?.getAttribute(attr) : el?.textContent?.trim()
              vals.push(text)
            }
            return { [label]: vals }
          }
        }).filter((item) => item !== undefined)
      }, target)

      if (!result.length) return {}

      // 格式化
      let formatResult = formatArrToObj(result)

      // 后置处理函数
      const afterFlag = after ? await after?.(formatResult) : true
      if (!afterFlag) return {} // 中断后续操作

      // 处理循环爬取
      formatResult = await this.loopRun(formatResult, target)

      // 自循环：把当前formatResult里面指定的key值的数组循环
      formatResult = await this.recursionRun(formatResult, params)

      // todo:处理下一页

      // 如果有回调函数，则执行回调函数
      return callback ? callback(formatResult) : formatResult
    } catch (error) {
      console.log('error', error)
      return {}
    } finally {
      await page.close()
    }
  }
}

export {PupCrawler, OpenPageOptions}
