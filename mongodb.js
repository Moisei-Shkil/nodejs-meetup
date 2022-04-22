const mongoose = require('mongoose');

const connect = async () => {
  await mongoose.connect('mongodb://root:pass@localhost:27017');
  console.log('Connected to DB');
};

const SDLSchema = new mongoose.Schema({
  industry: { type: String, required: true },
  sdl: { type: String, required: true },
  isActive: { type: Boolean, required: false, default: true },
});

const ClientDataSchema = new mongoose.Schema({
  industry: String,
  data: mongoose.Schema.Types.Mixed,
});

module.exports = {
  mongooseConnect: connect,
  SDL: mongoose.model('Sdls', SDLSchema, 'Sdls'),
  ClientData: mongoose.model('ClientData', ClientDataSchema, 'ClientData'),
};
