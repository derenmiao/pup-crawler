export interface obj {
  [key: string]: any
}

export interface Target {
  /**等待元素加载的css选择器 */
  waitCss?: string,
  /** 爬取属性设置 */
  values: Array<{
    /** 返回的对象属性名 */
    label: string,
    /** 要爬取的链接css选择器 */
    css: string | string[],
    /** 要爬取的属性, 如果不设置则默认取元素的textContent */
    attr?: string,
    /** 是否爬取全部: 默认false, <true: querySelectorAll, false: querySelector> */
    all?: boolean,
    /** 弱水三千，只取一瓢：配合all=true使用 */
    allIdx?: number
    /** 循环对象 */
    loopOpt?: CrawlOptions,
  }>
}

export interface CrawlOptions {
  /** 名 */
  name?: string,
  /** 要爬取的页面地址 */
  url?: string;
  /** 超时时间: 默认60s */
  timeout?: number;
  /** 延迟时间 */
  delayTime?: number;
  /** 自动滚动 */
  autoScroll?: boolean;
  /** 自动滚动间隔: 默认500ms */
  autoScrollInterval?: number;
  /** 要爬取的目标 */
  target: Target;
  /** 前置函数 */
  before?: () => boolean | Promise<boolean>;
  /** 后置函数 */
  after?: (obj: object) => boolean | Promise<boolean>;
  /** 回调函数 */
  callback?: (obj: object) => obj | Promise<obj>;
  /** 自循环递归 */
  recursion?: {
    /** 循环的key */
    loopKey: string,
    /** 循环需要取值target.values的label值，会统计成一个object */
    loopVals: string[],
  };
}

export interface IProps {
  host?: string
  console?: boolean
}