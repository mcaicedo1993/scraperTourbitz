var debug = require('debug');
var express = require('express');
var puppeteer = require('puppeteer');
var fs = require('fs');
var $ = require('cheerio');
var url = 'https://paramotrek.com/';
var path = require('path');


var info = {
    data: [],
    paragraph_fields: ['categoría', 'duración', 'nombre']
}

var methods = {
    'run': function (response) {
        return new Promise(async (resolve, reject) => {
            try {
                const browser = await puppeteer.launch();
                var page = await browser.newPage();
                await page.goto(url);
                var html = await page.content();
                console.log('Iniciando');
                var options_list = await methods.getMainNavigationOptions(html);

                var task = [];
                options_list.forEach((option) => {
                    task.push(methods.getParticularNavigationOptions(browser, option));
                });

                await Promise.all(task)
                    .then(methods.printFile)
                    .then(
                    function (filename) {
                        console.log('Descargando');
                        var full_path_file = path.join(__dirname, '..', filename);
                        response.setHeader('Content-Type', 'application/json');
                        response.download(full_path_file, filename);
                    }).catch(reject);
                console.log('Terminando');
            } catch (e) {
                return reject(e);
            }
        });
    },
    'getMainNavigationOptions': function (html) {
        var options_list = [];
        $('.ppb_tourcat_grid  .one_fourth.gallery4.filterable.portfolio_type', html).each(function () {
            var item = {
                'enlace': $(this).find('a.tour_image').first()[0].attribs.href,
                'titulo': $(this).find('.portfolio_info_wrapper h3').first().text()
            }
            options_list.push(item);
        });
        return options_list;
    },
    'getParticularNavigationOptions': function (browser, option) {
        return new Promise(async (resolve, reject) => {
            try {
                var page = await browser.newPage();
                await page.goto(option.enlace);
                var html = await page.content();

                var options_list = [];
                var num_proccesed_task = 1;

                console.log('pasando por getParticularNavigationOptions ' + option.titulo);

                $('#portfolio_filter_wrapper .element .one_half.portfolio_type .portfolio_info_wrapper ', html).each(function () {
                    var item = {
                        'titulo': $(this).find('a.tour_link h4').first().text(),
                        'enlace': $(this).find('a.tour_link').first()[0].attribs.href
                    }
                    options_list.push(methods.getInfoPage(browser, item));
                });

                Promise.all(options_list)
                    .then(function (i) {
                        resolve(true);
                    })
                    .catch(reject);
            }
            catch (e) {
                return reject(e);
            }
        });
    },
    'getInfoPage': function (browser, option) {
        return new Promise(async (resolve, reject) => {
            try {
                console.log('pasando por getInfoPage ' + option.enlace);
                var page = await browser.newPage();
                await page.goto(option.enlace, { waitUntil: 'load', timeout: 0 });
                var html = await page.content();

                var item = {
                    'enlace': option.enlace
                };

                item['titulo'] = $('.page_title_small_content h1', html).first().text();

                $('.single_tour_content .wpb_wrapper p strong', html).each(function () {
                    var text = $(this).text();
                    if (info.paragraph_fields.includes(text)) {
                        var parent = $(this).parent().text().toLowerCase();
                        if (parent.indexOf(text) >= 0) {
                            item[key_item] = parent.text();
                        }
                    }
                });

                $('.vc_tta-container .vc_tta-panel', html).each(function () {
                    var header = $(this).find('.vc_tta-panel-heading .vc_tta-title-text', html).first().text();
                    var value = $(this).find('.vc_tta-panel-body .wpb_wrapper p', html).first().text();
                    if (value.length == 0) {
                        value = $(this).find('.vc_tta-panel-body .wpb_wrapper ul', html).first().text();
                    }
                    if (value.length > 0) {
                        item[header] = value;
                    }
                });

                $('.vc_tta-container .vc_tta-panel', html).each(function () {
                    var header = $(this).find('.vc_tta-panel-heading .vc_tta-title-text', html).first().text();
                    var value = $(this).find('.vc_tta-panel-body .wpb_wrapper p', html).first().text();
                    if (value.length == 0) {
                        value = $(this).find('.vc_tta-panel-body .wpb_wrapper ul', html).first().text();
                    }
                    if (value.length > 0) {
                        item[header] = value;
                    }
                });

                var images_list = [];
                $('.vc_grid-container .vc_grid-item img.vc_gitem-zone-img', html).each(function () {
                    images_list.push($(this).first()[0].attribs.src);
                    var uuu = 9;
                });
                item['images'] = images_list;

                info.data.push(item);

                console.log('saliendo de getInfoPage ' + option.enlace);
                resolve(true);
            }
            catch (e) {
                return reject(e);
            }
        });
    },
    'printFile': function (eee) {
        console.log('Imprimiendo');
        var filename = 'results.json';
        var content_file = JSON.stringify(info.data);
        fs.writeFileSync(filename, content_file);
        return filename;
    }

}

module.exports = methods;