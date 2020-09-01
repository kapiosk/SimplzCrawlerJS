#!/usr/bin/env nodejs
'use strict';

const playwright = require('playwright');
const fs = require('fs');
const http = require('http');
const url = require('url');

function RunBot(){
    fs.readFile('NavigationOption.json', async (err, rawData) => {
        if (err !== null && err.length > 0) {
            console.log(err);
        } else {
            const data = await JSON.parse(rawData)
            await data.navigations.sort((a, b) => (a.order > b.order) ? 1 : -1)
            // https://www.npmjs.com/package/playwright

            const browser = await playwright['chromium'].launch({ headless: true });
            const context = await browser.newContext({ ignoreHTTPSErrors: true });
            const page = await context.newPage();

            for (let navIndex = 0; navIndex < data.navigations.length; navIndex++) {
                let obj = data.navigations[navIndex];

                await page.goto(obj.url);
                await page.waitForLoadState('networkidle');

                if (obj.steps !== undefined && obj.steps !== null && obj.steps.length > 0) {
                    await obj.steps.sort((a, b) => (a.order > b.order) ? 1 : -1)
                    for (let stepIndex = 0; stepIndex < obj.steps.length; stepIndex++) {
                        let p = obj.steps[stepIndex];
                        switch (p.action) {
                            case 'fill':
                                await page.fill(p.control, p.value);
                                break;
                            case 'click':
                                await page.click(p.control);
                                await page.waitForLoadState('networkidle');
                                break;
                        }
                    }
                }

                if (obj.screenshot) { await page.screenshot({ path: 'screenshots/' + obj.order + '.png' }); }
            };
            browser.close();
        }
    });
}

if (process.argv.length == 2){
    RunBot();
} else {
    http.createServer((req, res) => {
        const reqUrl = url.parse(request.url, true);
        if (req.method === 'GET' && reqUrl.pathname === '/RunBot') {
            RunBot();
        }
        res.writeHead(200);
        res.end('OK');
    }).listen(8083, '0.0.0.0');
}