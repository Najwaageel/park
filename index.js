const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
require("dotenv").config()
const Joi = require("joi")
const JoiObjectId = require("Joi-Objectid")
Joi.objectid = JoiObjectId(Joi)


const users = require("./routes/users")
const games = require("./routes/games")

mongoose
  .connect(`mongodb+srv://najwa:${process.env.MONGODB_PASSWORD1}@cluster0.hrnbt.mongodb.net/gamesDB?retryWrites=true&w=majority`)
  .then(() => console.log(" Connected to MongoDB"))
  .catch(error => console.log("Error connecting to MongoDB", error))


const app = express()
app.use(express.json())
app.use(cors())


app.use("/api/auth", users)
app.use("/api/games", games)



const port = 5000
app.listen(port, () => console.log("server is listening on port :" + port))
