const rp = require('request-promise');
const $ = require('cheerio');
const url = "https://www.argenprop.com/departamento-alquiler-barrio-belgrano";


const ArgenpropScrapper = {};


ArgenpropScrapper.processElement = argenPropElement => {
	let details = $(' a > .card__details-box', argenPropElement);
	let photos = $(' a > .card__photos-box', argenPropElement);
	let parsedData = ArgenpropScrapper.processData(details);
	let parsedPhotos = ArgenpropScrapper.processPhotos(photos);
};

ArgenpropScrapper.processData = argenPropData => {
	let direccion = $('.card__location-address-box > .card__address ', argenPropData)[0].children[0].data;
	console.log(direccion);
};

ArgenpropScrapper.processPhotos = argenPropPhotos => {
	console.log(argenPropPhotos);
};

ArgenpropScrapper.scrap = () => {
	rp(url)
		.then(function (html) {
			const list = $('.listing-container > .listing__items > .listing__item', html);
			for (let i = 0; i < list.length; i++) {
				ArgenpropScrapper.processElement(list[i]);
			}
		})
		.catch(function (err) {
			console.log(err);
		});
};


module.exports = ArgenpropScrapper;
