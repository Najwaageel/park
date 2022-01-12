const mongoose = require("mongoose")
const Joi = require("joi")

const ratingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
    },
    rating:Number,
})

const gameSchema = new mongoose.Schema({
 name: String,
 image: String,
 price: Number,
 ratings: [ ratingSchema ],
   ratingAverage:{
       type: Number,
       default: 0,
   },
   comments: [
      {
          type: mongoose.Types.ObjectId,
          ref: "Comment",
      }, 
   ],
   likes: [
       {
           type: mongoose.Types.ObjectId,
           ref: "User",   
       },
   ],
})



const gameAddJoi = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    image: Joi.string().uri().min(5).max(1000).required(), 
    price: Joi.number().min(1).max(100).required(),
})

const gameEditJoi = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    image: Joi.string().uri().min(5).max(1000).required(), 
    price: Joi.number().min(1).max(100).required(),
})

const ratingJoi = Joi.object({
    rating: Joi.number().min(0).max(5).required(),
})

const Game = mongoose.model("Game", gameSchema)

module.exports.Game = Game
module.exports.gameAddJoi = gameAddJoi
module.exports.gameEditJoi = gameEditJoi
module.exports.ratingJoi = ratingJoi
