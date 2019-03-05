'use strict';
var express = require('express');
var router = express.Router();
var paramotrek = require('../scrappers/paramotrek');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { title: 'Express' });
});

router.get('/scraping', function (req, res) {
    paramotrek.run(res).then(console.log).catch(console.error);
});



module.exports = router;
