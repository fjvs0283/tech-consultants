const Apify = require('apify');

const { BASE_URL } = require('./constants');
const { LabelTypes } = require('./enums');

const { utils: { log } } = Apify;

exports.handleStart = async ({ request, $ }, requestQueue) => {

    const totalPages = $('.pagination dd:nth-child(8)').text();
    const startUrl = request.url;
    const maxPages = 1;

    const pageLimit = (maxPages > 0) ? maxPages : parseInt(totalPages);

    for (currentPage = 0; currentPage < pageLimit; currentPage++) {
        const currentUrl = startUrl + `&p=${currentPage}`;
        log.info('adding url... ', { currentUrl });

        await requestQueue.addRequest({
            url: currentUrl,
            userData: {
                label: LabelTypes.PAGINATION,
            },
        });
    }
};

exports.handlePagination = async ({ $ }, requestQueue, inputData) => {
    $('.stations__station').each(async (index, element) => {

        const countries = inputData.countries.map(item => item.toLowerCase());
        const genres = inputData.genres.map(item => item.toLowerCase());

        const stationName = $(element).find('.stations__station__title > a > .station__title__name').text().trim();
        const stationCountry = $(element).find('.stations__station__info > li > a').attr('title');

        const stationGenres = [];
        $(element).find('.stations__station__tags li').each(async (index, element) => {
            const genre = $(element).find('a').text().trim();
            stationGenres.push(genre);
        });

        if (countries.includes(stationCountry.toLowerCase()) || countries.length === 0) {

            if (stationGenres.some(item => genres.includes(item))) {

                const href = $(element).find('.stations__station__title > a').attr('href');
                const url = BASE_URL + href;

                await requestQueue.addRequest({
                    url: url,
                    userData: {
                        label: LabelTypes.DETAIL,
                    },
                });
            }
        } else {
            // log.info(`${stationCountry} not found in input list`);
        }
    });
};

exports.handleDetail = async ({ request, $ }) => {

    const name = $('.station__title').text();
    const url = request.url;
    const country = $('.navbar__countries > a').text().trim() || '';
    const facebook = $('.i-fb--reference').attr('href') || '';
    const twitter = $('.i-tw--reference').attr('href') || '';
    const wikipedia = $('.i-wiki--reference').attr('href') || '';
    const likes = $('.i-chart').text().trim() || '';
    const liveListeners = $('.i-listeners').text().trim() || '';
    const website = $('.station__reference--web').attr('href') || '';
    const rating = $('.subject-rating__votes__value').find('span[itemprop="ratingValue"]').text().trim() || '';
    const reviews = $('.subject-rating__votes').find('span[itemprop="reviewCount"]').text().trim() || '';
    const address = $('.station-description').find('div[role="complementary"] > p[itemprop="address"]').text().trim().replace('Address: ', '') || '';
    const telephone = $('.station-description').find('div[role="complementary"] > p[itemprop="telephone"]').text().trim().replace('Phone: ', '') || '';
    const email = $('.station-description').find('div[role="complementary"] > p[itemprop="email"] > a').text().trim() || '';

    const genresList = [];
    $('.station__tags li').each(async (index, element) => {
        const genre = $(element).find('a').text().trim();
        genresList.push(genre);
    });
    
    const additionalDetails = $('.station-description')
        .find('div[role="complementary"] > p[itemprop="additionalProperty"]')
        .text()
        .trim()
        .split(/[\r\n\t]+/);

    let instagram = "";
    let youTube = "";
    let whatsApp = "";

    let details = [];
    additionalDetails.forEach(element => {
        if (element != '') {
            if (element.includes('WhatsApp')) {
                whatsApp = element.split(': ')[1];
            }
            else if (element.includes('instagram')) {
                instagram = element;
            }
            else if (element.includes('youtube')) {
                youTube = element;
            }
            else {
                details.push(element);
            }
        }
    });

    const output = {
        name,
        url,
        country,
        genresList,
        facebook,
        twitter,
        website,
        rating,
        reviews,
        likes,
        liveListeners,
        address,
        telephone,
        email,
        instagram,
        youTube,
        whatsApp,
        wikipedia,
        details
    };
    console.dir(output);

    await Apify.pushData({ ...output });
};