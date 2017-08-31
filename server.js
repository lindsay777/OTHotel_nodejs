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
const Promotion = DB.Promotion;
const Transaction = DB.Transaction;
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

// use
server.use(restifyPlugin.bodyParser());
server.use(restifyPlugin.queryParser());

server.listen(8070, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// promotion function
server.post('/post/promotion', new_promotion);
server.post('/update/promotion', update_promotion);
server.post('/delete/promotion', delete_promotion);

// room function
server.get('/get/room/all_room', find_all_room);
server.get('/get/room', find_room);
server.get('/get/room/price', get_price);
server.post('/post/room', new_room);
server.post('/post/multiroom', multiroom);
server.post('/post/discount', set_discount);
server.post('/update/room', update_room);
server.post('/delete/room', delete_room);
server.get('/update/isEarly', update_isEarly);
server.get('/update/isNight', update_isNight);

// order function
server.get('/get/order/all_order', find_all_order);
server.get('/get/order', find_order);
server.post('/post/order', new_order);
server.post('/update/order', update_order);
server.post('/delete/order', delete_order);

// PROMOTION
function new_promotion (req, res, next) {

	var data = {
		'id': req.body.id,
		'price': req.body.price
	}

	// create a new user called user ENTITY
	var promotion_data = new Promotion({
		id: data.id,
		price: data.price
	});
	console.log(chalk.cyan('id: %s, price: %s'), data.id, data.price);
	
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.new_promotion(	// transfer 是 contract 裡 的一個 function
		data.id, data.price,

		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.new_promotion.estimateGas(data.id, data.price) //執行function所需的gas ((發現放input突然就可以了
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
	promotion_data.save(function(err) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}
		console.log(chalk.cyan('Promotion %s is NEWED!'), data.id);
		// res.send('%s has been added to the DB!', data.name);
		res.send(data.id + ' is NEWED!');
		return next();
	});
};

function update_promotion (req, res, next) {

	var data = {
		'id': req.body.id,
		'price': req.body.price
	}
	console.log(chalk.cyan('id: %s, price: %s'), data.id, data.price);

	// find the room and update
	Promotion.findOneAndUpdate({ id: data.id }, { id: data.id, price: data.price}, function(err, user) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}else if( data.id == null ){
			console.log(chalk.red('cannot find id'));
			res.send('cannot find id');
			return next();
		}else{
			// we have the updated user returned to us
			console.log(chalk.cyan('Promotion %s is UPDATED!'), data.id);
			res.send(data.id + ' is UPDATED!');
			return next();
		}
	});
};

function delete_promotion (req, res, next) {

	var data = {
		'id': req.body.id,
	}

	// find the room and remove
	Promotion.findOneAndRemove({ id: data.id }, function(err) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		} else {
			// we have deleted the user
			console.log(chalk.cyan('Promotion %s is DELETED!'), data.id);
			res.send(data.id + ' is DELETED!');
			return next();
		}
		
	});
};

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
			res.send(rooms);
			return next();
		}
	});
};

function find_room (req, res, next) {

	let key = req.query.key;

	// get the room starlord55
	Room.find({ key: key }, function(err, room) {
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
		'total': req.body.total,
		'original_price': req.body.original_price,
		'sell_price': req.body.sell_price,
		'promotion_id':req.body.promotion_id,
		'isHoliday': req.body.isHoliday,
		'isEarly': req.body.isEarly
	}

	// create a new user called user ENTITY
	var room_data = new Room({
		key: data.key,
		total: data.total,
		original_price: data.original_price,
		sell_price: data.sell_price,
		promotion_id: data.promotion_id,
		isHoliday: data.isHoliday,
		isEarly: data.isEarly
	});
	console.log(chalk.cyan('key: %s, total: %s, soldout: 0'), data.key, data.total);
	console.log(chalk.cyan('original_price: %s, sell_price: %s, state: true, version: 0'), data.original_price, data.sell_price);
	console.log(chalk.cyan('promotion_id: %s, isHoliday: %s, isEarly: %s'), data.promotion_id, data.isHoliday, data.isEarly);

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.new_room(	// transfer 是 contract 裡 的一個 function
		data.key, data.total, data.original_price, data.sell_price, data.promotion_id, data.isHoliday, data.isEarly,

		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.new_room.estimateGas(data.key, data.total, data.original_price, data.sell_price, data.promotion_id, data.isHoliday, data.isEarly) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				var transaction_data = new Transaction({
					type: "room",
					id: data.key,
					hash: result
				});
				transaction_data.save(function(err) {
					if (err) {
						console.log(err);
						res.send(err.message);
						return next();
					}
					console.log(chalk.cyan("Transaction_Hash: %s"), result);
				});
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
			}
			else {
				console.log(err);
			}
		}
	);
};

function multiroom (req, res, next) {

	var data = {
		'startdate': req.body.startdate,
		'enddate': req.body.enddate,
		'room_type': req.body.room_type,
		'total': req.body.total,
		'original_price': req.body.original_price,
		'sell_price': req.body.sell_price,
		'promotion_id': req.body.promotion_id,
		'isHoliday': req.body.isHoliday,
		'isEarly': req.body.isEarly
	}

	data.startdate = new Date(data.startdate)
	data.enddate = new Date(data.enddate)

	var year = data.startdate.getFullYear()
	var month = data.startdate.getMonth()
	var day = data.startdate.getDate()
	
	var dates = [data.startdate];

	while(dates[dates.length-1] < data.enddate) {
	  dates.push(new Date(year, month, ++day));
	}

	dates.splice(0,1)	// 拿掉第一個...

	for (var i = 0; i < dates.length; i++) {
		var date = dates[i].toISOString().substring(0, 10)
		var key = date + '_' + data.room_type
		add_room(key,data.total, data.original_price, data.sell_price, data.promotion_id, data.isHoliday, data.isEarly)
	}

	res.send('Rooms are NEWED!');
	return next();

	function add_room (key, total, original_price, sell_price, promotion_id, isHoliday, isEarly) {
		// create a new user called user ENTITY
		var room_data = new Room({
			key: key,
			total: total,
			original_price: original_price,
			sell_price: sell_price,
			promotion_id: promotion_id,
			isHoliday: isHoliday,
			isEarly: isEarly
		});
		console.log(chalk.cyan('key: %s, total: %s, soldout: 0'), room_data.key, room_data.total);
		console.log(chalk.cyan('original_price: %s, sell_price: %s, state: true, version: 0'), room_data.original_price, room_data.sell_price);
		console.log(chalk.cyan('promotion_id: %s, isHoliday: %s, isEarly: %s'), room_data.promotion_id, room_data.isHoliday, room_data.isEarly);

		web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
		myContract.new_room(	// transfer 是 contract 裡 的一個 function
			room_data.key, room_data.total, room_data.original_price, room_data.sell_price, room_data.promotion_id, room_data.isHoliday, room_data.isEarly,

			{
				from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
				'gas': myContract.new_room.estimateGas(room_data.key, room_data.total, room_data.original_price, room_data.sell_price, room_data.promotion_id, room_data.isHoliday, room_data.isEarly) //執行function所需的gas ((發現放input突然就可以了
			},
			function(err, result) {	//callback 的 function
				if (!err){
					console.log("Transaction_Hash: " + result);
					var transaction_data = new Transaction({
						type: "room",
						id: room_data.key,
						hash: result
					});
					transaction_data.save(function(err) {
						if (err) {
							console.log(err);
							res.send(err.message);
							return next();
						}
						console.log(chalk.cyan("Transaction_Hash: %s"), result);
					});
					// call the built-in save method to save to the database
					room_data.save(function(err) {
						if (err) {
							console.log(err);
							res.send(err.message);
							return next();
						}
						console.log(chalk.cyan('Room %s is NEWED!'), room_data.key);
						// res.send('%s has been added to the DB!', room_data.name);
					});
				}
				else {
					console.log(err);
				}
			}
		);
	}
};

function set_discount (req, res, next) {
	
	var data = {
		'new_discount_weekday': req.body.new_discount_weekday,
		'new_discount_weekend': req.body.new_discount_weekend,
		'new_discount_lastroom': req.body.new_discount_lastroom
	}

	console.log(chalk.cyan('Discount: weekday: %s, weekend: %s, lastroom: %s'), data.new_discount_weekday, data.new_discount_weekend, data.new_discount_lastroom);
	
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.set_discount(	// transfer 是 contract 裡 的一個 function
		data.new_discount_weekday, data.new_discount_weekend, data.new_discount_lastroom,

		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.set_discount.estimateGas(data.new_discount_weekday, data.new_discount_weekend, data.new_discount_lastroom) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log("Transaction_Hash: " + result);
				res.send('set discount success');
				return next();
			}
			else {
				console.log(err);
				res.send('set discount failed');
				return next();
			}
		}
	);
};

function update_room (req, res, next) {

	var data = {
		'key': req.body.key,
		'total': req.body.total,
		'soldout': req.body.soldout,
		'original_price': req.body.original_price,
		'promotion_id': req.body.promotion_id,
		'isHoliday': req.body.isHoliday
	}
	console.log(chalk.yellow("     Update Room     "));
	console.log(chalk.cyan('key: %s, total: %s, soldout: %s'), data.key, data.total, data.soldout);
	console.log(chalk.cyan('original_price: %s, promotion_id: %s, isHoliday: %s'), data.original_price, data.promotion_id, data.isHoliday);

	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.edit_room(	// transfer 是 contract 裡 的一個 function
		data.key, data.total, data.soldout, data.original_price, data.promotion_id, data.isHoliday,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.edit_room.estimateGas(data.key, data.total, data.soldout, data.original_price, data.promotion_id, data.isHoliday)  //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				var transaction_data = new Transaction({
					type: "room",
					id: data.key,
					hash: result
				});
				transaction_data.save(function(err) {
					if (err) {
						console.log(err);
						res.send(err.message);
						return next();
					}
					console.log(chalk.cyan("Transaction_Hash: %s"), result);
					update(req, res, next)
				});
				
			}
			else {
				console.log(err);
			}
		}
	);

	function update(req, res, next){
		// find the room and update
		Room.findOneAndUpdate({ key: data.key }, { key: data.key, total: data.total, soldout: data.soldout, original_price: data.original_price, promotion_id: data.promotion_id, isHoliday: data.isHoliday}, function(err, user) {
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
	}
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

function get_price (req, res, next) {

	let key = req.query.key;

	let result = myContract.get_price(web3.toHex(key));

	console.log(web3.toHex(key));

	let state = result[0];
	let price = result[1].c[0];

	if (price == 0){
		console.log(chalk.cyan('Cannot get price!'));
		res.send('Cannot get price!');
		return next();
	} else {
		console.log(chalk.cyan('price: %s'), price);
		res.send(String(price));
		return next();
	}

	if (state){
		web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
		myContract.state_change(	// transfer 是 contract 裡 的一個 function
			key, price,
			{
				from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
				'gas': myContract.state_change.estimateGas(key, price) //執行function所需的gas ((發現放input突然就可以了
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
		return next();
	}else{
		return next();
	}
};

function update_isEarly (req, res, next) {
	var data = {
		'key': req.body.key,
		'isEarly': req.body.isEarly
	}
	console.log(chalk.cyan('key: %s, isEarly: %s'), data.key, data.isEarly);
	
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.update_isEarly(	// transfer 是 contract 裡 的一個 function
		data.key, data.isEarly,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.update_isEarly.estimateGas(data.key, data.isEarly)  //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log("Transaction_Hash: " + result);
				update(req, res, next)
			}
			else {
				console.log(err);
			}
		}
	);

	function update(req, res, next){
		// find the room and update
		Room.findOneAndUpdate({ key: data.key }, { key: data.key, isEarly: data.isEarly}, function(err, user) {
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
				console.log(chalk.cyan('Room %s isEarly is UPDATED!'), data.key);
				res.send(data.key + ' isEarly is UPDATED!');
				return next();
			}
		});
	}
};

function update_isNight (req, res, next) {
	var data = {
		'key': req.body.key,
		'isNight': req.body.isNight
	}
	console.log(chalk.cyan('key: %s, isNight: %s'), data.key, data.isNight);
	
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account
	myContract.update_isNight(	// transfer 是 contract 裡 的一個 function
		data.key, data.isNight,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.update_isNight.estimateGas(data.key, data.isNight)  //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				console.log("Transaction_Hash: " + result);
				update(req, res, next)
			}
			else {
				console.log(err);
			}
		}
	);

	function update(req, res, next){
		// find the room and update
		Room.findOneAndUpdate({ key: data.key }, { key: data.key, isNight: data.isNight}, function(err, user) {
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
				console.log(chalk.cyan('Room %s isNight is UPDATED!'), data.key);
				res.send(data.key + ' isNight is UPDATED!');
				return next();
			}
		});
	}
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
			console.log(chalk.red('cannot find any order'));
			res.send('cannot find any order');
			return next();
		}else{
			// object of all the users
			res.send(orders);
			return next();
		}
	});
};

function find_order (req, res, next) {	

	// get the user starlord55
	Order.find({ order_id: req.query.order_id }, function(err, order) {
		if (err) {
			console.log(err);
			res.send(err.message);
			return next();
		}else if (order.length == 0){
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

	console.time("new_order_time");
	console.time("before_transaction_time");
	console.time("transaction_time");

	var data = {
		'user_id': req.body.user_id,
		'date': req.body.date,
		'room_type': req.body.room_type,
		'price': req.body.price
	};

	//要新增一筆訂單
	data.key = data.date + '_' + data.room_type
	console.log(data.key)
	data.order_id = data.key + '_' + data.user_id + '_' + moment().format('HH:mm:ss');

	console.log(chalk.cyan('user_id: %s, key: %s, order_id: %s, price: %s'), data.user_id, data.key, data.order_id, data.price);

	event_filter(req, res, next);

	// BC
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account

	console.timeEnd("before_transaction_time");
	myContract.new_order(	// transfer 是 contract 裡 的一個 function
		data.key, data.user_id, data.date, data.room_type, data.order_id, data.price,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.new_order.estimateGas(data.key, data.user_id, data.date, data.room_type, data.order_id, data.price) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				var transaction_data = new Transaction({
					type: "order",
					id: data.order_id,
					hash: result
				});
				transaction_data.save(function(err) {
					if (err) {
						console.log(err);
						res.send(err.message);
						return next();
					}
					console.log(chalk.yellow("Transaction_Hash: %s"), result);
				});
				console.timeEnd("transaction_time");
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
				if(web3.toAscii(result.args.order_id) == data.order_id){
					if(result.args.check == true){
						new_order_event.stopWatching();
						console.log(result);

						save(req, res, next);
						console.log(chalk.magentaBright('order %s is NEWED in BC!'), data.order_id);
					}
					else if(result.args.check == false)
						console.log(chalk.magentaBright('order Unavailable'))
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
			order_id: data.order_id,
			price: data.price
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
			res.send('order ' + data.order_id + ' successed');
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
			console.timeEnd("new_order_time");
			return next();
		});
	}	
};

function update_order (req, res, next) {

	var data = {
		'order_id': req.body.order_id,
		'user_id': req.body.user_id,
		'date': req.body.date,
		'room_type': req.body.room_type,
		'price': req.body.price
	}

	// 從order_id切一切拿到舊的key
	var fields = data.order_id.split('_');
	data.old_key = fields[0] + '_' + fields[1];
	data.new_key = data.date + '_' + data.room_type;

	console.log(chalk.cyan('user_id: %s, new_key: %s, price: %s'), data.user_id, data.new_key, data.price);

	event_filter(req, res, next);

	// BC
	web3.personal.unlockAccount(web3.eth.coinbase, 'internintern', 300);	//解鎖要執行 function 的 account

	myContract.update_order(	// transfer 是 contract 裡 的一個 function
		data.old_key, data.new_key, data.user_id, data.date, data.room_type, data.order_id, data.price,
		{
			from: web3.eth.coinbase,	//從哪個ethereum帳戶執行
			'gas': myContract.update_order.estimateGas(data.old_key, data.new_key, data.user_id, data.date, data.room_type, data.order_id, data.price) //執行function所需的gas ((發現放input突然就可以了
		},
		function(err, result) {	//callback 的 function
			if (!err){
				var transaction_data = new Transaction({
					type: "order",
					id: data.order_id,
					hash: result
				});
				transaction_data.save(function(err) {
					if (err) {
						console.log(err);
						res.send(err.message);
						return next();
					}
					console.log(chalk.yellow("Transaction_Hash: %s"), result);
				});
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