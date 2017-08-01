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
	order_id: { type: String, required: true, unique: true }
});

var roomSchema = new mongoose.Schema({
	key: { type: String, required: true, unique: true },
	total: Number,
	soldout: Number
})

orderSchema.plugin(uniqueValidator);
roomSchema.plugin(uniqueValidator);

// we need to create a model using it
var Order = mongoose.model('Order', orderSchema);
var Room = mongoose.model('Room', roomSchema);

// make this available to our users in our Node applications
module.exports = {
	Order, Room
}