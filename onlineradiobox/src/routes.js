const Apify = require('apify');

const { BASE_URL } = require('./constants');
const { LabelTypes } = require('./enums');

const { utils: { log } } = Apify;

exports.handleStart = async ({ request, $ }, requestQueue) => {

    const totalPages = $('.pagination dd:nth-child(8)').text();
    const startUrl = request.url;
    // const pageLimit = parseInt(totalPages);
    const pageLimit = 1;

    for (currentPage = 0; currentPage < pageLimit; currentPage++) {
        const currentUrl = startUrl + `&p=${currentPage}`;
        log.info('this is the current url: ', { currentUrl });

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

        function findCommonElements3(arr1, arr2) {
            return arr1.some(item => arr2.includes(item))
        }

        if (countries.includes(stationCountry.toLowerCase()) || countries.length == 0) {
            log.info('station genres: ', stationGenres);
            log.info('genre: ', genres[0]);

            // TODO: update this to match more than 1 genre in both arrays
            if (stationGenres.includes(genres[0])) {

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

    const genresList = [];
    $('.station__tags li').each(async (index, element) => {
        const genre = $(element).find('a').text().trim();
        genresList.push(genre);
    });

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
    let instagram = "";
    let youTube = "";
    let whatsApp = "";
    const additionalDetails = $('.station-description')
        .find('div[role="complementary"] > p[itemprop="additionalProperty"]')
        .text()
        .trim()
        .split(/[\r\n\t]+/);

    let details = [];
    additionalDetails.forEach(function (element, index) {
        const detail = element;
        if (detail != '') {
            if (detail.includes('WhatsApp')) {
                whatsApp = detail.split(': ')[1];
            }
            else if (detail.includes('instagram')) {
                instagram = detail;
            }
            else if (detail.includes('youtube')) {
                youTube = detail;
            }
            else {
                details.push(detail);
            }

        }
    });
    /*
        log.info(`station name: ${name}`);
        log.info(`country: ${country}`);
        log.info(`genres: ${genresList}`);
        log.info(`rating: ${rating}`);
        log.info(`reviews: ${reviews}`);
        log.info(`likes: ${likes}`);
        log.info(`liveListeners: ${liveListeners}`);
        log.info(`website: ${website}`);
        log.info(`address: ${address}`);
        log.info(`telephone: ${telephone}`);
        log.info(`email: ${email}`);
        log.info(`facebook: ${facebook}`);
        log.info(`twitter: ${twitter}`);
        log.info(`instagram: ${instagram}`);
        log.info(`youTube: ${youTube}`);
        log.info(`whatsApp: ${whatsApp}`);
        log.info(`wikipedia: ${wikipedia}`);
        log.info(`additional details: ${details}`);
        log.info('––––––––––––––––––––––––––––––––––––––––––––––––––––––––––');
    */
    await Apify.pushData({
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
        details
    });
};
