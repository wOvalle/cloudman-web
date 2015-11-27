var express = require('express');
var router = express.Router();
var cloudman = require('cloudman-api');
var cred = require('../cred.js');
cloudman.init(cred);

router.get('/instances', function(req, res, next) {
  var providers = cred.map(c => c.keyName);
  cloudman.status(providers).then(function(data){
    res.json(data);
  });
});

module.exports = router;
