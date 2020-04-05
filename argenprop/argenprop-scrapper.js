const rp = require('request-promise');
const $ = require('cheerio');
const baseUrl = "https://www.argenprop.com"
const url = "https://www.argenprop.com/departamento-alquiler-barrio-belgrano";
const ArgenpropScrapper = {};

const mongoose = require('mongoose');


ArgenpropScrapper.processElement = argenPropElement => {
	let details = $(' a > .card__details-box', argenPropElement);
	let photos = $(' a > .card__photos-box', argenPropElement);
	let parsedData = ArgenpropScrapper.processData(details);
	let parsedPhotos = ArgenpropScrapper.processPhotos(photos);
	let parsedUrl = $(' a ', argenPropElement)[0];
	let redirectUrl = baseUrl + parsedUrl.attribs.href;
	return {
		originUrl: redirectUrl,
		title: parsedData.title,
		address: parsedData.address,
		description: parsedData.description,
		info: parsedData.info,
		price: parsedPhotos.price.basePrice,
		extraCost: parsedPhotos.price.expensesPrice,
		images: parsedPhotos.images,
	}
};

ArgenpropScrapper.processData = argenPropData => {

	let address = $('.card__location-address-box > .card__address ', argenPropData)[0].children[0].data;
	address = address.replace("\n", "").trim();
	let title = $(' .card__title ', argenPropData)[0].children[0].data;
	title = title.replace("\n", "").trim();
	let info = [];
	let infoHtml = $(".card__common-data", argenPropData)[0].children;
	for (let i = 0; i < infoHtml.length; i++) {
		if (infoHtml[i].type === "text") {
			info.push(infoHtml[i].data.replace("\n", "").trim())
		}
	}
	let description = $('.card__info ', argenPropData)[0].children[0].data;
	description = description.replace("\n", "").trim();
	return {
		address: address,
		title: title,
		description: description,
		info: ArgenpropScrapper.processInfo(info)
	}
};

ArgenpropScrapper.processInfo = info => {
	let bedroomQuantity = undefined;
	let bathroomQuantity = undefined;
	let m2 = 0;
	let isNew = false;
	let monoambiente = false;
	let years = undefined;
	let disposition = undefined;
	let kind = undefined;

	for (let i = 0; i < info.length; i++) {
		if (info[i].includes("m²")) {
			m2 = info[i].split(" ")[0];
		} else if (info[i].includes("dormitorio")) {
			bedroomQuantity = info[i].split(" ")[0];
		} else if (info[i].includes("Monoambiente")) {
			monoambiente = true;
			bedroomQuantity = 0
		} else if (info[i].includes("Apto")) {
			kind = info[i];
		} else if (info[i].includes("año") && !info[i].includes("baño")) {
			years = info[i].split(" ")[0]
		} else if (info[i].includes("baño")) {
			bathroomQuantity = info[i].split(" ")[0]
		} else if (info[i].includes("estrenar")) {
			isNew = true;
			years = 0
		} else if (info[i] === "Contrafrente" || info[i] === "Frente" || info[i] === "Lateral") {
			disposition = info[i]
		}
	}

	return {
		bedroomQuantity: bedroomQuantity,
		bathroomQuantity: bathroomQuantity,
		m2: m2,
		isNew: isNew,
		monoambiente: monoambiente,
		years: years,
		disposition: disposition,
		kind: kind
	};
};

ArgenpropScrapper.processPhotos = argenPropPhotos => {
	let images = $('.card__carousel > .card__photos > li > img', argenPropPhotos).toArray();
	images = images.map(image => {
		return {
			src: image.attribs["data-src"],
			alt: image.attribs.alt
		}
	});
	let priceElement = $('.card__monetary-values', argenPropPhotos);
	let expensesElement = $('.card__expenses', priceElement);
	let basePriceElementNodes = $('.card__price', priceElement)[0].children;
	let basePrice = {
		currency: basePriceElementNodes[1].children[0].data,
		quantity: basePriceElementNodes[2].data.trim()
	};
	let extraCosts = undefined;
	if (expensesElement.length > 0) {
		let extraCostParts = expensesElement[0].children[0].data.trim().split(" ");
		extraCosts = {
			type: extraCostParts[2],
			cost: extraCostParts[1]
		};
	}
	return {
		images: images,
		price: {
			basePrice: basePrice,
			expensesPrice: extraCosts
		},

	}
};

ArgenpropScrapper.scrap = () => {
	rp(url)
		.then(function (html) {
			const list = $('.listing-container > .listing__items > .listing__item', html).toArray();
			let publications = list.map(element => {
				return ArgenpropScrapper.processElement(element);
			});
			console.log(publications);
		})
		.catch(function (err) {
			console.log(err);
		});
};


module.exports = ArgenpropScrapper;
