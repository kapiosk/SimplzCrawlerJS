'use strict';

const playwright = require('playwright');
const fs = require('fs');

fs.readFile('NavigationOption.json', async (err, rawData) => {
    if (err !== null && err.length > 0) {
        console.log(err);
    } else {
        //start headless browser
        const browser = await playwright['chromium'].launch({ headless: true });
        //create browser context with https errors disabled
        const context = await browser.newContext({ ignoreHTTPSErrors: true });
        //add new tab page
        const page = await context.newPage();

        const data = await JSON.parse(rawData);
        //sort navigation and loop
        await data.navigations.sort((a, b) => (a.order > b.order) ? 1 : -1)
        for (let inx = 0; inx < data.navigations.length; inx++) {
            let obj = data.navigations[inx];

            //navigate url
            await page.goto(obj.url);

            //wait page to load
            await page.waitForLoadState('networkidle');

            //follow steps if any
            if (obj.steps !== undefined && obj.steps !== null && obj.steps.length > 0) {
                //sort steps and loop
                await obj.steps.sort((a, b) => (a.order > b.order) ? 1 : -1)
                for (let ind = 0; ind < obj.steps.length; ind++) {
                    let p = obj.steps[ind];
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

            if (obj.screenshot) {
                await page.screenshot({ path: 'screenshots/' + Date.now() + '.png' });
            }
        };
        browser.close();
    }
});