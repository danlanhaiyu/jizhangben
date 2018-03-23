var settings = require('../Settings');
var Db = require('mongodb').Db;
var Connection=require('mongodb').Connection;
var Server = require('mongodb').Server;

//20180323
var MongoClient = require('mongodb').MongoClient;

module.exports = new Db(settings.db,new Server(settings.host,27017,{}));
