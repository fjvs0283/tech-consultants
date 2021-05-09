const Apify = require('apify');
const { handleStart, handlePagination, handleDetail } = require('./routes');
const { LabelTypes } = require('./enums');

const { utils: { log } } = Apify;

Apify.main(async () => {

    const { countries, genres, maxStations, includeAdditionalInfo } = await Apify.getInput()
    const inputData = { countries, genres, maxStations, includeAdditionalInfo }

    const startUrl = {
        url: 'https://onlineradiobox.com/genre/pop-/?cs=be.nostalgiebelgique',
        userData: {
            label: LabelTypes.START,
        },
    };
    
    const requestQueue = await Apify.openRequestQueue();
    await requestQueue.addRequest(startUrl);

    // proxy settings
    const proxyConfiguration = await Apify.createProxyConfiguration({
        groups: ['SHADER'],
    });

    const crawler = new Apify.CheerioCrawler({
        maxConcurrency: 5,
        requestQueue,
        proxyConfiguration,
        useSessionPool: true,
        persistCookiesPerSession: true,
        
        handlePageFunction: async (context) => {
            const { url, userData: { label } } = context.request;
            switch (label) {
                case LabelTypes.START:
                    return handleStart(context, requestQueue);
                case LabelTypes.PAGINATION:
                    return handlePagination(context, requestQueue, inputData);
                case LabelTypes.DETAIL:
                    return handleDetail(context);
                default:
                    return handleStart(context, requestQueue);
            }
        },
    });

    log.info('Starting the crawl.');
    await crawler.run();
    log.info('Crawl finished.');
});
