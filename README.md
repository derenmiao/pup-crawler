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
    await crawler.crawlPage({
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

复杂用法：详细看example.ts文件，那以腾讯动漫为例，爬取列表和详情和内容页。
```typescript
target: {
    values: [
        // 1. 普通获取值, 例如获取 .item > a 中的文本内容。attr默认获取textContent
        {label: 'val', css: '.item > a'}, 
        // 2. 获取属性值, 例如获取 .item > a 中的href属性值。attr = getAttribute('xxx')
        {label: 'val2', attr: 'href', css: '.item > a'}, 
        // 3. 实现 document.querySelectorAll('.item > a') 功能。 加 all: true=querySelectorAll, false=querySelector
        {label: 'val3', attr: 'href', css: '.item > a', all: true}, 
        // 4. 实现 document.querySelectorAll('.item > a')[3] 功能。 加 all: true, allIdx: 3
        {label: 'val4', attr: 'href', css: '.item > a', all: true, allIdx: 3}, 
        // 5. 实现 document.querySelectorAll('.item > a')[3].querySelector('.sub-item > a') 功能。 加 all: true,  allIdx: 3
        {label: 'val5', attr: 'href', css: ['.item > a', '.sub-item > a'], all: true, allIdx: 3}, 
        // 6. 获取 window.location.href 值, 不用加属性,需要从window对象开始获取
        {label: 'val6',  css: 'window.location.href'}, 
        // 7. 获取多个a标签的href值，且循环遍历。 加 loopOpt: CrawlOptions; loopOpt执行完的值是下一个target.values的对象，会赋给label，
        {label: 'val7', attr: 'href', css: '.list-item > ul > li > a', all: true, loopOpt: NextPageOpt}, 
        ...
    ],
    // 在本类型页面循环，例如获取某个电视剧播放的集数列表的播放源
    // loopKey：1、从上面values中选循环的label对应的值（一般是all: true的，loopOpt：不再做下一层循环）
    // loopVals：2、从上面values中选循环的label需要返回的值。比如最后一个页面没必要太多值，只需要val2， val4这两个值
    recursion: { loopKey: 'playList', loopVals: ['val2', 'val4'] },
    // 前置函数，返回true则继续执行。常用控制页面爬取，例如数据库检查当前爬取值是否已存在
    before: () => boolean | Promise<boolean>,
    // 后置函数，返回true则继续爬取。爬网当前页面配置的values值后执行。
    after: (obj: object) => boolean | Promise<boolean>,
    // 回调函数，可以处理格式化后的结果。
    callback?: (obj: object) => obj | Promise<obj>
}
```


### 配置项

```typescript
/** 爬取页面的配置项 */
export interface CrawlOptions {
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
        loopOpt?: CrawlOptions,
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
4. `crawlPage` 方法：爬取页面。