var mongodb = require('./db');
var MongoClient = require('./db');

function User(user) {
	this.name = user.name;
	this.password = user.password;
};
module.exports = User;
User.prototype.save = function save(callback) {
	// ���� Mongodb ���ĵ�
	var user = {
		name: this.name,
		password: this.password,
	};
	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// ��ȡ users ����
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// Ϊ name �����������
			collection.ensureIndex('name', {unique: true});
			// д�� user �ĵ�
			collection.insert(user, {safe: true}, function(err, user) {
				mongodb.close();
				callback(err, user);
			});
		});

	});
};
User.get = function get(username, callback) {

	mongodb.open(function(err, db) {
		if (err) {
			return callback(err);
		}
		// ��ȡ users ����
		db.collection('users', function(err, collection) {
			if (err) {
				mongodb.close();
				return callback(err);
			}
			// ���� name ����Ϊ username ���ĵ�
			collection.findOne({name: username}, function(err, doc) {
				mongodb.close();
				if (doc) {
					// ��װ�ĵ�Ϊ User ����
					var user = new User(doc);
					callback(err, user);
				} else {
					callback(err, null);
				}
			});
		});
	});
};