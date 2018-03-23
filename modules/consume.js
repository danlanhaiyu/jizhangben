var mongodb = require('./db');
var BSON = require('mongodb').BSONPure;
var util=require('util');
var settings=require('../Settings');

function toObjectId(id){
	console.log("转换值："+id);
	if( id=="" || id=="null" || id=="undefined" || id==undefined || id==null)return null;
	return BSON.ObjectID.createFromHexString(id);
}

function Consume(username, consumeDate,consumeSubject,consumeAmount,consumeRemark, time)
{
	//加载时要单独赋值
	this._id=null;
	
    this.userName = username;
    this.consumeDate = consumeDate;
    this.consumeSubject = consumeSubject;
    this.consumeAmount = consumeAmount;
    this.consumeRemark = consumeRemark;

    if (time)
    {
        this.time = time;
    }
    else
    {
        this.time = new Date();
    }
    
};
module.exports = Consume;

Consume.prototype.loadFromReq = function loadFromReq(username,reqBody,time){
	//自动进行了ID类型的转换。
	this._id = toObjectId(reqBody._id);
    this.userName = username;
    this.consumeDate = reqBody.consumeDate;
    this.consumeSubject = reqBody.consumeSubject;
    this.consumeAmount = reqBody.consumeAmount;
    this.consumeRemark = reqBody.consumeRemark;

    if (time)
    {
        this.time = time;
    }
    else
    {
        this.time = new Date();
    }
}

Consume.prototype.save = function save(callback)
{
    // 存入 Mongodb 的文档
    var record = 
    {
    	_id:this._id,
        userName: this.userName, 
        consumeDate: this.consumeDate, 
        consumeSubject: this.consumeSubject, 
        consumeAmount: this.consumeAmount, 
        consumeRemark: this.consumeRemark, 
        time: this.time, 
    };
    console.log('保存，记录日期：'+record.consumeDate);
    mongodb.open(function(err, db){
        if (err)
        {
            return callback(err); 
        }
        // 读取 posts 集合
        db.collection('consume', function(err, collection){
            if (err)
            {
                mongodb.close(); return callback(err); 
            }

            // 插入
            /*
            collection.insert(record, {safe: true} , function(err, post){
                mongodb.close(); callback(err, post); 
            }); 
            */
           
           console.log("插入或更新，判断依据_id="+record._id);
		   if(record._id==null){
		   	   delete record._id;
		   	   console.log("删除_id，record._id="+record._id);
		   }
           collection.update({_id:(record._id?record._id:'no-record')}, record, {upsert:true,multi:false} , function(err, post){
                mongodb.close(); callback(err, post); 
            }); 
        }); 
    });
};

//删除方法
Consume.del = function del(id,callback){
	mongodb.open(function(err,db){
        if (err){
            return callback(err); 
        }
        
		var query = {_id:BSON.ObjectID.createFromHexString(id)};
		
        db.collection('consume', function(err, collection){
            if (err){
                mongodb.close(); 
                return callback(err); 
            }

			collection.remove(query,{safe:true},function(err,result){
				mongodb.close();
		        if (err){
		            return callback(err); 
		        }
		        console.log("删除成功。");
				callback(null); 
		    }) ;
		});    
   	});
};


Consume.get = function get(username,options, callback)
{
    mongodb.open(function(err, db){
        if (err){
            return callback(err); 
        }
        // 读取 posts 集合
        db.collection('consume', function(err, collection){
            if (err){
                mongodb.close();
                return callback(err); 
            }

            var query = {};
            if(options.keyword){
            	//var regx = new RegExp("/"+options.keyword+"/");
            	//注意，不用/
            	var regx = new RegExp(options.keyword);
            	//限制用户名，科目或者金额与输入关键相等
				query={"$and":[{userName:username},
							   {"$or":[{consumeSubject:regx},
									   {consumeDate:regx},
									   {consumeRemark:regx},
							   		   {consumeAmount:options.keyword}
									  ]
							   }]
					   };
            }
            else{
                query.userName = username; 
            }
            //console.log("搜索条件：");
            //console.log(query);
            /*
            if(!options.limit){
            	options.limit=0;
            }
            */
            
            collection.count(query,function(err,count){
            	if(err){
            		mongodb.close();
            		callback(err,null);
            	}
            	
            	//正确得到数量，再查询
            	
        		var findOptions = {sort:{consumeDate:-1 }};
        		if(options.pageindex){
	            	var skip = 0;//跳过的数量
	            	var pagecount = settings.pageSize;//每页条数
	            	if(options.pageindex>1) skip = (options.pageindex-1)*pagecount;
	            	findOptions.skip=skip;
	            	findOptions.limit=pagecount;
            		console.log("页码："+options.pageindex+"，跳过："+skip);
        		}
            	
	            collection.find(query,findOptions).toArray(function(err, docs){
	                mongodb.close(); 
	                if (err){
	                    callback(err, null); 
	                }

	                var consumes = []; 
	                docs.forEach(function(doc, index){
	                    var record = new Consume(doc.userName, doc.consumeDate,doc.consumeSubject,doc.consumeAmount,doc.consumeRemark, doc.time);
	                 	record._id = doc._id;
	                    consumes.push(record); 
	                }); 
	                callback(null, consumes,count); 
	            }); 
            	
            });
            
        }); 
    });
};

//全部取，不分页，这个是老版函数，作为备份保留
Consume.getall = function getall(username,options, callback)
{
    mongodb.open(function(err, db){
        if (err){
            return callback(err); 
        }
        // 读取 posts 集合
        db.collection('consume', function(err, collection){
            if (err){
                mongodb.close();
                return callback(err); 
            }

            var query = {};
            if(options.keyword){
            	//var regx = new RegExp("/"+options.keyword+"/");
            	//注意，不用/
            	var regx = new RegExp(options.keyword);
            	//限制用户名，科目或者金额与输入关键相等
				query={"$and":[{userName:username},
							   {"$or":[{consumeSubject:regx},
									   {consumeDate:regx},
							   		   {consumeAmount:options.keyword}
									  ]
							   }]
					   };
            }
            else{
                query.userName = username; 
            }
            console.log("搜索条件：");
            console.log(query);
            if(!options.limit){
            	options.limit=0;
            }
            collection.find(query).sort({consumeDate:-1 }).limit(options.limit).toArray(function(err, docs){
                mongodb.close(); 
                if (err){
                    callback(err, null); 
                }

                var consumes = []; 
                docs.forEach(function(doc, index){
                    var record = new Consume(doc.userName, doc.consumeDate,doc.consumeSubject,doc.consumeAmount,doc.consumeRemark, doc.time);
                 	record._id = doc._id;
                    consumes.push(record); 
                }); 
                callback(null, consumes); 
            }); 
        }); 
    });
};


Consume.stat = function stat(username, callback)
{
    mongodb.open(function(err, db){
        if (err){
            return callback(err); 
        }
        // 读取 posts 集合
        db.collection('consume', function(err, collection){
            if (err){
                mongodb.close();
                return callback(err); 
            }

			var reduce = function(obj,prev){
					prev.amount += isNaN(obj.consumeAmount)?0:Number(obj.consumeAmount);
					prev.count++;
			};
		
            collection.group(
            	[ 'consumeSubject' ],
        		{userName:username},
        		{count:0,amount:0},
            	reduce,
            	function(err, result){
                	mongodb.close(); 
	                if (err){
	                    callback(err, null); 
	                }
	                else{
	                	console.log(result[0]);
	                	var amount = 0,count=0;
	                	result.forEach(function (item,index){
	                		amount += item.amount;
	                		count += item.count;
	                	});
	                	result.push({consumeSubject:'【合计】',count:count,amount:amount});
	                	callback(null, result); 
	                }
	        });
        }); 
    });
};


Consume.getSubject = function getSubject(username, callback)
{
    mongodb.open(function(err, db){
        if (err){
            return callback(err); 
        }
        db.collection('consume',{userName:username},function (err,collection){
            if (err){
                mongodb.close();
                return callback(err); 
            }
            
            collection.distinct('consumeSubject',function(err,docs){
            	mongodb.close();
            	if(!err){
            		docs = docs.sort();
            		console.log(docs);
            		callback(err,docs);
            	}
            });
        });
    });
};

//统计记录数
Consume.count = function count(username, callback)
{
    mongodb.open(function(err, db){
        if (err){
            return callback(err,0); 
        }
        // 读取 posts 集合
        db.collection('consume', function(err, collection){
            if (err){
                mongodb.close();
                return callback(err,0); 
            }
            
            collection.count({userName:username},function(err,count){
            	mongodb.close();
		        if (err){
		            return callback(err,0); 
		        }
		        
		        callback(null,count);
            });
        });
    });
};

Consume.month = function month(username, callback)
{
    mongodb.open(function(err, db){
        if (err){
            return callback(err); 
        }
        // 读取 posts 集合
        db.collection('consume', function(err, collection){
            if (err){
                mongodb.close();
                return callback(err); 
            }
            
			var map = function(){
				emit(this.consumeDate.substr(0,7),{amount:this.consumeAmount,count:1});
			};
			
			var reduce = function(key,vals){
				var val = 0,count=0;
				for(var i=0; i<vals.length;i++){
					val += isNaN(vals[i].amount)?0:Number(vals[i].amount);
					count++;
				}
				return {amount:val,count:count};
			}
			
			console.log("统计："+username);
            collection.mapReduce(
            	map,
        		reduce,
        		{out: {replace : 'temp', readPreference : 'secondary', query:{userName:username}}},
            	function(err, collection){
	                if (err){
                		mongodb.close(); 
	                    callback(err, null); 
	                }
	                else{
	                	//console.log(collection);
	                	/*
	                	var amount = 0,count=0;
	                	result.forEach(function (item,index){
	                		amount += item.amount;
	                		count += item.count;
	                	});
	                	result.push({consumeSubject:'【合计】',count:count,amount:amount});
	                	*/
	                	
	            		var results = [];
	                	collection.find().toArray(function(err,docs){
	                		docs.forEach(function(item,idx){
	                			console.log(item);
	                			//为了共用结果页面，统一使用consumeSubject
		                		results.push({consumeSubject:item._id,amount:item.value.amount,count:item.value.count});
	                		});
	                		mongodb.close();
		                	callback(null, results); 
	                	});
	                }
	        });
        }); 
    });
};
