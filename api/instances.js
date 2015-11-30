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

router.get('/instances/dispositions', function(req, res, next) {
  cloudman.validDispositions().then(function(data){
    res.json(data);
  });
});

router.get('/providers', function(req, res, next) {
  res.json(cloudman.validAccounts());
});

//todo: refactor onError
router.post('/instances', function(req, res, next) {
  var params = req.body;

  if (params.method === 'start') {
    cloudman.start(params.data).then(function(r){
      res.json(r);
    }).catch(function (err) {
      res.status(500).send(err);
    });
  }
  else if (params.method === 'stop') {
    cloudman.stop(params.data).then(function(r){
      res.json(r);
    }).catch(function (err) {
      res.status(500).send(err);
    });
  }
  else if (params.method === 'terminate') {
    cloudman.terminate(params.data).then(function(r){
      res.json(r);
    }).catch(function (err) {
      res.status(500).send(err);
    });
  }
  else if (params.method === 'create') {
    if(!params.newInstance) {
      res.status(500).send({message: 'No properties passed'});
      return;
    }

    cloudman.create(params.newInstance).then(function(r){
      res.json(r);
    }).catch(function (err) {
      res.status(500).send(err);
    });
  }
  else {
    res.status(500).send({message: 'method __ not implemented'.replace('__', data.method)});
  }
});

module.exports = router;
