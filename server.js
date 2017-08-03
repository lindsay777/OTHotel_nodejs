var restify = require('restify');
var restifyPlugin = require('restify-plugins');
var moment = require('moment');

// if our user.js file is at app/models/user.js
const Web3 = require('./web3');
const web3 = Web3.web3;
const myContract = Web3.myContractInstance;

const DB = require('./db');
const Order = DB.Order;
const Room = DB.Room;

// chalk
const chalk = require('chalk');

const server = restify.createServer({
  name: 'myapp',
  version: '1.0.0'
});

// 
server.use(
  function crossOrigin(req,res,next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    return next();
  }
);

// user
server.use(restifyPlugin.bodyParser());

// room function
server.get('/get/room/all_room', find_all_room);
server.get('/get/room', find_room);
server.post('/post/room', new_room);
server.post('/update/room', update_room);
server.post('/delete/room', delete_room);

server.listen(8070, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// order function
// server.get('/echo/:name', name);
server.get('/get/order/all_order', find_all_order);
server.get('/get/order', find_order);
server.post('/post/order', new_order);
server.post('/update/order', update_order);
// server.post('/delete/all_user', delete_all_user);
server.post('/delete/order', delete_order);

// function name (req, res, next) {
// 	res.send(req.params.name);
// 	return next();
// };

// ROOM
function find_all_room (req, res, next) {

	// get all the users
	Room.find({}, function(err, rooms) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}else if (rooms.length == 0){
			console.log('cannot find any room');
			res.send('cannot find any room');
			return next();
		}else{
			// object of all the rooms
			console.log(rooms);
			res.send(rooms);
			return next();
		}
	});
};

function find_room (req, res, next) {

	// get the room starlord55
	Room.find({ key: '2017-08-11_1' }, function(err, room) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		else if (room.length == 0){
			console.log('cannot find room');
			res.send('cannot find room');
			return next();
		}else{
			// object of the room
			console.log(room);
			res.send(room);
			return next();
		}
	});
};

function new_room (req, res, next) {

	var data = {
		'key': req.body.key,
		'total': req.body.total
	}

	// create a new user called user ENTITY
	var room_data = new Room({
		key: data.key,
		total: data.total
	});
	console.log(chalk.cyan('key: %s, total: %s, soldout: 0'), data.key, data.total);

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.new_room(	// transfer 是 contract 裡 的一個 function
		data.key, data.total, 

		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.new_room.estimateGas(data.key, data.total) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log("Transaction_Hash: " + result);
			}
			else {
				console.log(err);
			}
		}
	);

	// call the built-in save method to save to the database
	room_data.save(function(err) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		console.log(chalk.cyan('Room %s is NEWED!'), data.key);
		// res.send('%s has been added to the DB!', data.name);
		res.send(data.key + ' is NEWED!');
		return next();
	});
};

function update_room (req, res, next) {

	var data = {
		'key': req.body.key,
		'total': req.body.total,
		'soldout': req.body.soldout		
	}
	console.log(chalk.cyan('key: %s, total: %s, soldout: %s'), data.key, data.total, data.soldout);

	// find the room and update
	Room.findOneAndUpdate({ key: data.key }, { key: data.key, total: data.total, soldout: data.soldout}, function(err, user) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}else if( data.key == null ){
			console.log(chalk.red('cannot find key'));
			res.send('cannot find key');
			return next();
		}else{
			// we have the updated user returned to us
			console.log(chalk.cyan('Room %s is UPDATED!'), data.key);
			res.send(data.key + ' is UPDATED!');
			return next();
		}
	});
};

function delete_room (req, res, next) {

	var data = {
		'key': req.body.key,
	}

	// find the room and remove
	Room.findOneAndRemove({ key: data.key }, function(err) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		} else {
			// we have deleted the user
			console.log(chalk.cyan('Room %s is DELETED!'), data.key);
			res.send(data.key + ' is DELETED!');
			return next();
		}
		
	});
};


// ORDER
function find_all_order (req, res, next) {

	// get all the users
	Order.find({}, function(err, orders) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		else if (orders.length == 0){
			console.log(chalk.red('cannot find any user'));
			res.send('cannot find any user');
			return next();
		}else{
			// object of all the users
			console.log(orders);
			res.send(orders);
			return next();
		}
	});
};

function find_order (req, res, next) {

	// get the user starlord55
	Order.find({ order_id: req.body.order_id }, function(err, order) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		else if (order.length == 0){
			console.log('cannot find order');
			res.send('cannot find order');
			return next();
		}else{
			// object of the order
			console.log(order);
			res.send(order);
			return next();
		}
	});
};

function new_order (req, res, next) {

	var data = {
		'user_id': req.body.user_id,
		'date': req.body.date,
		'room_type': req.body.room_type
	}

	//要新增一筆訂單
	data.key = data.date + '_' + data.room_type
	console.log(data.key)
	data.order_id = data.key + '_' + data.user_id + '_' + moment().format('HH:mm:ss');

	console.log(chalk.cyan('user_id: %s, key: %s, order_id: %s'), data.user_id, data.key, data.order_id);

	event_filter(req, res, next);

	// BC
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account

	myContract.new_order(	// transfer 是 contract 裡 的一個 function
		data.key, data.user_id, data.date, data.room_type, data.order_id,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.new_order.estimateGas(data.key, data.user_id, data.date, data.room_type, data.order_id) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.yellow("Transaction_Hash: " + result));
			}
			else {
				console.log(err);
			}
		}
	);
	
	//必須確認 監聽這個訂單有沒有拿到(true false) 回傳false代表沒有這個
	function event_filter (req, res, next) {
		var new_order_event = myContract.new_order_event({},{
			toBlock: 'latest'
		});

		var block = web3.eth.getBlock('latest').number;
		new_order_event.watch(function(error, result){
			if (!error && result.blockNumber > block){
				if(web3.toAscii(result.args.key) == data.key){
					if(result.args.check == true){
						new_order_event.stopWatching();
						console.log(result);

						save(req, res, next);
						console.log(chalk.magentaBright('order %s is NEWED in BC!'), data.order_id);
					}
					else if(result.args.check == false)
						print_color(chalk.magentaBright('order Unavailable'))
				}
			}
		});
	}

	// DB
	// 如果前面回傳true 表示有成功 可以把它寫進資料庫
	function save(req, res, next){
		// create a new user called user ENTITY
		var order_data = new Order({
			key: data.key,
			user_id: data.user_id,
			date: data.date,
			room_type: data.room_type,
			order_id: data.order_id
		});

		// call the built-in save method to save to the database
		order_data.save(function(err) {
			if (err) {
				console.log(err);
				res.send(err.message);
				return next();
			}
			console.log(chalk.magentaBright('order %s is NEWED in DB!'), data.order_id);
			// res.send('%s has been added to the DB!', data.name);
			// res.send(data.order_id);
		});

		Room.findOneAndUpdate({ key: data.key },
			{
	      		$inc: {
	        		soldout: 1
	      		} 
	      	},
	  		function(err, room) {
			if (err) {
				console.log(err);
				res.send(err.message);
				return next();
			}else if(room == null){
				console.log('cannot find room!');
			}
			console.log(chalk.cyan('room: %s soldout +1!'),data.key);
			return next();
		});
	}	
};

function update_order (req, res, next) {

	var data = {
		'order_id': req.body.order_id,
		'user_id': req.body.user_id,
		'date': req.body.date,
		'room_type': req.body.room_type
	}

	// 從order_id切一切拿到舊的key
	var fields = data.order_id.split('_');
	data.old_key = fields[0] + '_' + fields[1];
	data.new_key = data.date + '_' + data.room_type;

	console.log(chalk.cyan('user_id: %s, new_key: %s'), data.user_id, data.new_key);

	event_filter(req, res, next);

	// BC
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account

	myContract.update_order(	// transfer 是 contract 裡 的一個 function
		data.old_key, data.new_key, data.user_id, data.date, data.room_type, data.order_id,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.update_order.estimateGas(data.old_key, data.new_key, data.user_id, data.date, data.room_type, data.order_id) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.yellow("Transaction_Hash: " + result));
			}
			else {
				console.log(err);
			}
		}
	);

	//必須確認 監聽這個訂單有沒有拿到(true false) 回傳false代表沒有這個
	function event_filter (req, res, next) {
		var update_order_event = myContract.update_order_event({},{
			toBlock: 'latest'
		});

		var block = web3.eth.getBlock('latest').number;
		update_order_event.watch(function(error, result){
			if (!error && result.blockNumber > block){
				if(web3.toAscii(result.args.new_key) == data.new_key){
					if(result.args.check == true){
						update_order_event.stopWatching();
						console.log(result);

						save(req, res, next);
						console.log(chalk.magentaBright('order %s is UPDATED in BC!'), data.order_id);
					}
					else if(result.args.check == false)
						console.log(chalk.magentaBright('order Unavailable'))
				}
			}
		});
	}

	// DB
	// update order
	function save(req, res, next){
		Order.findOneAndUpdate({ order_id: data.order_id }, { key: data.new_key, user_id: data.user_id, date: data.date, room_type: data.room_type, order_id: data.order_id }, function(err, user) {
			if (err) {
				console.log(err);
				res.send(err.message);
				return next();
			}else if( data.order_id == null ){
				console.log('cannot find order_id');
				res.send('cannot find order_id');
				return next();
			}else{
				// we have the updated user returned to us
				console.log(chalk.magentaBright('order %s is UPDATED in DB!'), data.order_id);
				res.send(data.order_id);
			}
		});
		// change room: old key soldout -1, new key soldout +1
		Room.findOneAndUpdate({ key: data.old_key },
			{
	      		$inc: {
	        		soldout: -1
	      		} 
	      	},
	  		function(err, room) {
				if (err) {
					console.log(err);
					res.send(err.message);
					return next();
			}
		});
		Room.findOneAndUpdate({ key: data.new_key },
			{
	      		$inc: {
	        		soldout: 1
	      		} 
	      	},
	  		function(err, room) {
				if (err) {
					console.log(err);
					res.send(err.message);
					return next();
			}
		});
		console.log(chalk.cyan('room %s soldout -1, room %s soldout +1'), data.old_key, data.new_key);
		return next();
	}
};

function delete_order (req, res, next) {

	var data = {
		'order_id': req.body.order_id,
		'key': req.body.key
	}

	// BC
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account

	myContract.delete_order(	// transfer 是 contract 裡 的一個 function
		data.order_id, data.key,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.delete_order.estimateGas(data.order_id, data.key) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log(chalk.yellow("Transaction_Hash: " + result));
			}
			else {
				console.log(err);
			}
		}
	);

	// DB
	// remove order
	Order.findOneAndRemove({ order_id: data.order_id }, function(err) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		} else {
			// we have deleted the user
			console.log(chalk.magentaBright('order: %s is DELETED'), data.order_id);
			res.send(data.order_id);
		}
	});
	// change room soldout
	Room.findOneAndUpdate({ key: data.key },
		{
      		$inc: {
        		soldout: -1
      		} 
      	},
  		function(err, room) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}

		console.log(chalk.cyan('room: %s soldout -1!'),data.key);
		return next();
	});
};