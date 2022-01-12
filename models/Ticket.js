const mongoose = require("mongoose")
const Joi = require("joi")


const ticketSchema = new mongoose.Schema({
    date: String,
    gameId: {
        type: mongoose.Types.ObjectId,
        ref: "Game",
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },  
    qrcode: String,
    
  })

  
  const ticketJoi = Joi.object({
    date: Joi.string().min(3).max(1000).required(),
  })
  
  const Ticket = mongoose.model("Ticket", ticketSchema)
  
  module.exports.Ticket = Ticket
  module.exports.ticketJoi =  ticketJoi