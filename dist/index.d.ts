import { Browser, LaunchOptions, Page } from 'puppeteer';
import type { IProps, OpenPageOptions, Target, obj } from './types.d.ts';
declare class PupCrawler {
    browser: Browser | undefined;
    url: string | undefined;
    host: string;
    console: boolean;
    states: obj;
    constructor(props?: IProps);
    open(options?: LaunchOptions): Promise<void>;
    close(): Promise<void>;
    setValue(key: string, value: any): void;
    getValue(key: string): any;
    /** 页面滚动 */
    scorllToBottom(page: Page, interval: number): Promise<void>;
    /** 循环获取 */
    loopRun(result: obj, target: Target): Promise<obj>;
    /** 自循环 */
    recursionRun(result: obj, options: OpenPageOptions): Promise<obj>;
    /** 爬取页面属性：PipePageOptions */
    openPage(params: OpenPageOptions): Promise<obj>;
}
export { PupCrawler, OpenPageOptions };
