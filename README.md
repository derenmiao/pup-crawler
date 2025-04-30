## PUP Crawler

这是一个基于puppeteer的简单的爬虫，可以爬取动态、静态加载的网站。
常用于【列表-详情-内容】系列的网站，比如电影视频等网站。

### Usage

```shell
npm install pup-crawler
```

简单用法：
```ts
import { PupCrawler } from 'pup-crawler'

(async () => {
    const crawler = new PupCrawler()
    await crawler.open()
    crawler.openPage({
        name: 'list',
        url: 'https://www.example.com/list',
        target: {
            values: [
                {label: 'detailData', attr: 'href', css: '.list-item > a', all: true}, 
            ]
        },
        callback: async (result: any) => {
            const { detailData } = result
            console.log(detailData)
        }
    })
    await crawler.close()
})

```

复杂用法：以腾讯动漫为例，爬取列表和详情和内容页。
```typescript
{{ include_relative example.ts }}
```

### 配置项

```typescript
/** 爬取页面的配置项 */
export interface OpenPageOptions {
  /** 页面打印名称 */
  name?: string,
  /** 要爬取的页面地址， 非必填因为有loopOpt常设置链接元素的href */
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
  target: {
    /**等待元素加载的css选择器 */
    waitCss?: string,
    /** 爬取属性设置 */
    values: Array<{
        /** 返回的对象属性名 */
        label: string,
        /** 要爬取的链接css选择器, 支持数组[主元素，子元素] */
        css: string | string[],
        /** 要爬取的属性, 如果不设置则默认取元素的textContent */
        attr?: string,
        /** 是否爬取全部: 默认false, <true: querySelectorAll, false: querySelector> */
        all?: boolean,
        /** 弱水三千，只取一瓢：配合all=true使用 */
        allIdx?: number
        /** 循环对象 */
        loopOpt?: OpenPageOptions,
    }>
  };
  /** 前置函数：返回true则继续爬取，返回false则停止爬取 */
  before?: () => boolean | Promise<boolean>;
  /** 后置函数：返回true则继续爬取，返回false则停止爬取 */
  after?: (obj: object) => boolean | Promise<boolean>;
  /** 回调函数 */
  callback?: (obj: object) => obj | Promise<obj>;
  /** 当前类型的页面：自循环，递归 */
  recursion?: {
    /** 循环的key，取值target.values的label中 */
    loopKey: string,
    /** 循环需要取值target.values的label哪些值，会组成一个object */
    loopVals: string[],
  };
}


export interface IProps {
  /** 网页前缀 */
  host?: string
  /** 日志输出 */
  console?: boolean
}
```

### API

1. `PupCrawler` 类：用于创建爬虫实例，并提供一些方法用于控制爬虫的运行。
2. `open` 方法：打开浏览器，并等待浏览器启动完成。
3. `close` 方法：关闭浏览器，并等待浏览器关闭完成。
4. `openPage` 方法：爬取页面。