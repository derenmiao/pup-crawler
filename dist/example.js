"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import {PupCrawler, OpenPageOptions} from './index'
// import {PupCrawler, OpenPageOptions} from 'pup-crawler'
const index_js_1 = require("./dist/index.js");
// https://ac.qq.com/Comic/all/page/1
async function example() {
    const crawler = new index_js_1.PupCrawler({ host: 'https://ac.qq.com' });
    await crawler.open(); // 打开浏览器调试 {headless: false, args: ['--no-sandbox']}
    // 章节页面配置
    const chapterOpt = {
        name: 'chapter',
        delayTime: 3000,
        autoScroll: true, // 自动滚动，直到浏览器底部
        autoScrollInterval: 1000, // 自动滚动的间隔时间
        target: {
            values: [
                { label: 'images', attr: 'src', css: '#comicContain > li > img', all: true }, // 内容图
                { label: 'name', css: 'span.title-comicHeading' }
            ]
        },
        callback: (result) => {
            const { name, images } = result;
            const data = { name, values: images };
            console.log('chapter info =>>', data);
            return data;
        }
    };
    // 详情页面配置
    const detailOpt = {
        name: 'detail',
        target: {
            waitCss: '.works-intro', // 等待爬取内容加载完成
            values: [
                { label: 'title', css: '.works-intro-title > strong' }, // 标题
                { label: 'author', css: 'p.works-intro-digi > span.first > em' }, // 作者
                { label: 'score', css: 'div.works-score > p > strong.ui-text-orange' }, // 评分
                { label: 'popularity', css: 'p.works-intro-digi > em > span', all: true, allIdx: 0 }, // 人气
                { label: 'collect', css: 'p.works-intro-digi > em > span', all: true, allIdx: 1 }, // 收藏数
                { label: 'intro', css: 'p.works-intro-short' }, // 简介
                { label: 'tags', css: '#tags-show > a', all: true }, // 标签
                { label: 'cover', attr: 'href', css: 'div.works-cover > a' }, // 封面图
                { label: 'chapterData', attr: 'href', css: 'ol.works-chapter-list > li > p > span.works-chapter-item > a', loopOpt: chapterOpt } // 章节数据
            ]
        },
        callback: (result) => {
            console.log('detail info =>>', result);
            return result;
        }
    };
    // 爬取1-10页的列表数据
    for await (let page of Array.from({ length: 10 }, (_, i) => i + 1)) {
        const url = `/Comic/all/page/${page}`;
        await crawler.openPage({
            name: 'list',
            url: url,
            target: {
                waitCss: '.ret-main', // 等待爬取内容加载完成
                values: [
                    // 以这个节点的href作为详情页的url，循环爬取详情页数据
                    { label: 'detailData', attr: 'href', css: '.ret-search-list > li >div.ret-works-info > a', all: true, loopOpt: detailOpt },
                ]
            }
        });
    }
    await crawler.close(); // 关闭浏览器
}
example();
