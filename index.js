#!/usr/bin/env nodejs
'use strict';

const playwright = require('playwright');
const fs = require('fs');
const http = require('http');
const url = require('url');

let isBotRunning = false;

function RunBot(){
    fs.readFile('NavigationOption.json', async (err, rawData) => {
        isBotRunning = true;
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
            isBotRunning = false;
        }
    });
    
}

async function CreatePDF(req, res, body) {
    const requestUrl = url.parse(req.url, true);

    const browser = await playwright['chromium'].launch({ headless: true });
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage();

    if (requestUrl.query.url){
        await page.goto(requestUrl.query.url);
        await page.waitForLoadState('networkidle');
    } else if (body){
        await page.setContent(body);
    }

    let pdf = await page.pdf({ format: 'A4' });
    browser.close();

    if (pdf) {
        res.writeHead(200);
        res.end(pdf);
    } else {
        res.writeHead(200);
        res.end('OK');
    }    
}

if (process.argv.length == 1){
    RunBot();
} else {
    http.createServer((req, res) => {
        const reqUrl = url.parse(req.url, true);
        if (req.method === 'GET' && reqUrl.pathname === '/RunBot') {
            res.writeHead(200);
            if (!isBotRunning){
                RunBot();
                res.end("Bot Started");
            } else {
                res.end("Bot Is Running!");
            }
        } else if (reqUrl.pathname === '/PDF'){
            let body = '';
            req.on('data', function (chunk) {
                body += chunk;
            }).on('end', function(){
                CreatePDF(req, res, body);
            });
        }

    }).listen(8083, '0.0.0.0');
}