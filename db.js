var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
// Using `mongoose.connect`...
mongoose.Promise = global.Promise;
var db_connection = mongoose.connect('mongodb://localhost/mongodb', {
  useMongoClient: true,
  /* other options */
});

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('DB is connected');
});

// create a schema
var orderSchema = new mongoose.Schema({
	key: { type: String, required: true },
	user_id: { type: String, required: true },
	date: { type: String, required: true },
	room_type: { type: Number, required: true },
	order_id: { type: String, required: true, unique: true },
	price: { type: Number, required: true }
});

var roomSchema = new mongoose.Schema({
	key: { type: String, required: true, unique: true },
	total: { type: Number, required: true },
	soldout: { type: Number, default: 0 },
	original_price: { type: Number, required: true },
	sell_price: { type: Number, required: true },
	state: { type: Boolean, required: true , default: true},
	promotion_id: { type: Number, required: true, default: 0 },
	isHoliday: { type: Boolean, required: true, default: false},
	isEarly: { type: Boolean, required: true, default: false}
});

var promotionSchema = new mongoose.Schema({
	id: { type: Number, required: true, unique: true },
	price: { type: Number, required: true, default: 0 }
});

orderSchema.plugin(uniqueValidator);
roomSchema.plugin(uniqueValidator);
promotionSchema.plugin(uniqueValidator);

// we need to create a model using it
var Order = mongoose.model('Order', orderSchema);
var Room = mongoose.model('Room', roomSchema);
var Promotion = mongoose.model('Promotion', promotionSchema);

// make this available to our users in our Node applications
module.exports = {
	Order, Room, Promotion
}