
var endpoints = {
    scraping: '/scraping'
}

var methods = {
    init: function () {
        console.log('Iniciando scripts del lado del cliente');
    },
    start_scraping: function () {
        window.location.replace(window.location.origin + endpoints.scraping);
    },
}

methods.init();