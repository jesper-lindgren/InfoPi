var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('development', { title: 'Development screen' });
});

module.exports = router;
