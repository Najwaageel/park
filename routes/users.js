const express = require("express")
const router = express.Router()
const { User, signupJoi, loginJoi, profileJoi } = require("../models/User")
const { Comment } = require("../models/Comment")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const checkToken = require("../middleware/checkToken")
const checkAdmin = require("../middleware/checkAdmin")
const validateBody = require("../middleware/validateBody")
const checkId = require("../middleware/checkId")
const nodemailer = require("nodemailer")
const { Ticket } = require("../models/Ticket")


// ------------------------- sign ----------------------//

router.post("/signup", validateBody(signupJoi), async (req, res) => {
    try {
      const { firstName, lastName, email, password, avatar } = req.body
  
      const userFound = await User.findOne({ email }) 
      if (userFound) return res.status(400).send("user already reqistered")
  
      const salt = await bcrypt.genSalt(10) 
      const hash = await bcrypt.hash(password, salt)
  
      const user = new User({
        firstName,
        lastName,
        email,
        password: hash,
        avatar,
        emailVerified: false,
        role: "User",
      })
        await user.save()
  
      delete user._doc.password
      res.send("sign seccess")
    } catch (error) {
      res.status(500).send(error.message)
    }
  })

  // ---------------------- login -----------------//

  router.post("/login", validateBody(loginJoi), async (req, res) => {
    try {
      const { email, password } = req.body
  
      const user = await User.findOne({ email })
      if (!user) return res.status(404).send("user not found")
  
      const valid = await bcrypt.compare(password, user.password) 
      if (!valid) return res.status(400).send("password incorrect")
  
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "90d" }) 
  
      res.send(token)
    } catch (error) {
      res.status(500).send(error.message)
    }
  })

  router.post("/login/admin", validateBody(loginJoi), async (req, res) => {
    try {
      const { email, password } = req.body
  
      const user = await User.findOne({ email })
      if (!user) return res.status(404).send("user not found")
      if (user.role != "Admin") return res.status(403).send("you are not admin")
  
      const valid = await bcrypt.compare(password, user.password) 
      if (!valid) return res.status(400).send("password incorrect")
  
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: "90d" }) 
      res.send(token)
    } catch (error) {
      res.status(500).send(error.message)
    }
  })

// ------------------------- profile --------------------- //

  router.get("/profile", checkToken, async (req, res) => {
    const user = await User.findById(req.userId).select("-__v -password").populate("likes").populate({
      path: "tickets",
      populate: ["owner", "gameId"]
    })
    res.json(user)
  })
  router.put("/profile", checkToken, validateBody(profileJoi), async (req, res) => {
    const { firstName, lastName, password, avatar } = req.body
  
    let hash
    if (password) {
      const salt = await bcrypt.genSalt(10) 
      hash = await bcrypt.hash(password, salt)
    }
  
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { firstName, lastName, password: hash, avatar } },
      { new: true }
    ).select("-__v -password")
  
    res.json(user)
  })
  
  router.post("/add-admin", checkAdmin, validateBody(signupJoi), async (req, res) => {
    
    try {
      const { firstName, lastName, email, password, avatar } = req.body
  
      const userFound = await User.findOne({ email })
      if (userFound) return res.status(400).send("user already reqistered")
  
      const salt = await bcrypt.genSalt(10) 
      const hash = await bcrypt.hash(password, salt)
  
      const user = new User({
        firstName,
        lastName,
        email,
        password: hash,
        avatar,
        role: "Admin",
      })
  
      await user.save()
  
      delete user._doc.password
  
      res.json(user)
    } catch (error) {
      res.status(500).send(error.message)
    }
  })
  
  router.get("/users", checkAdmin, async (req, res) => {
    const users = await User.find().select("-password -__v")
    res.json(users)
  })
  
  router.delete("/users/:id", checkAdmin, checkId, async (req, res) => {
    try {
      const user = await User.findById(req.params.id)
      if (!user) return res.status(404).send("user not found")
  
      if (user.role === "Admin") return res.status(403).send("unauthorized action")
  
      await User.findByIdAndRemove(req.params.id)
  
      await Comment.deleteMany({ owner: req.params.id })
  
      res.send("user is deleted")
    } catch (error) {
      res.status(500).send(error.message)
    }
  })
  router.get("/gametickets", async (req, res) => {
    try{
    const tickets = await Ticket.find().populate("owner").populate("gameId")
    res.json(tickets)
  } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
      }
  })
  
  module.exports = router

  

  