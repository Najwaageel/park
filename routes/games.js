const express = require("express")
const router = express.Router()
const nodemailer = require("nodemailer")
const validateBody = require("../middleware/validateBody")
const validateId = require("../middleware/validateId")
const checkAdmin = require("../middleware/checkAdmin")
const checkId = require("../middleware/checkId")
const checkToken = require("../middleware/checkToken")
const { Game, gameAddJoi, gameEditJoi, ratingJoi } = require("../models/Game")
const { Comment, commentJoi } = require("../models/Comment")
const { User } = require("../models/User")
const { Ticket, ticketJoi } = require("../models/Ticket")
const QRCode = require("qrcode")

// --------------------- Games -------------------------//
router.get("/", async (req, res) => {
  const games = await Game.find().populate({ path: "comments", populate: { path: "owner", select: "-password" } })

  res.json(games)
})

router.get("/:id", checkId, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id).populate({
      path: "comments",
      populate: { path: "owner", select: "-password" },
    })

    if (!game) return res.status(404).send("game not found")
    res.json(game)
  } catch (error) {
    console.log(error)
    return res.status(500).send(error.message)
  }
})

router.post("/", checkAdmin, validateBody(gameAddJoi), async (req, res) => {
  try {
    const { name, image, price } = req.body

    const game = new Game({
      name,
      image,
      price,
    })

    await game.save()
    res.json(game)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.put("/:id", checkAdmin, checkId, validateBody(gameEditJoi), async (req, res) => {
  try {
    const { name, image, price } = req.body

    const game = await Game.findByIdAndUpdate(req.params.id, { $set: { name, image, price } }, { new: true })

    if (!game) return res.status(404).send("game not found")
    res.json(game)
  } catch (error) {
    console.log(error)
    return res.status(500).send(error.message)
  }
})

router.delete("/:id", checkAdmin, checkId, async (req, res) => {
  try {
    await Comment.deleteMany({ gameId: req.params.id })

    const game = await Game.findByIdAndRemove(req.params.id)
    if (!game) return res.status(404).send("game not found")
    res.send("game is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

// --------------------- Comments -------------------------//

router.get("/:gameId/comments", validateId("gameId"), async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).send("game not found")

    const comments = await Comment.find({ gameId: req.params.gameId })
    res.json(comments)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/:gameId/comments", checkToken, validateId("gameId"), validateBody(commentJoi), async (req, res) => {
  try {
    const { comment } = req.body

    const game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).send("game not found")

    const newComment = new Comment({ comment, owner: req.userId, gameId: req.params.gameId })

    await Game.findByIdAndUpdate(req.params.gameId, { $push: { comments: newComment._id } })

    await newComment.save()
    res.json(newComment)
  } catch (error) {
    console.log(error)
    return res.status(500).send(error.message)
  }
})

router.put(
  "/:gameId/comments/:commentId",
  checkToken,
  validateId("gameId", "commentId"),
  validateBody(commentJoi),
  async (req, res) => {
    try {
      const game = await Game.findById(req.params.gameId)
      if (!game) return res.status(404).send("game not found")

      const { comment } = req.body

      const commentFound = await Comment.findById(req.params.commentId)
      if (!commentFound) return res.status(404).send("comment not found")

      if (commentFound.owner != req.userId) return res.status(403).send("unauthorized action")
      const updataedComment = await Comment.findByIdAndUpdate(
        req.params.commentId,
        { $set: { comment } },
        { new: true }
      )

      res.json(updataedComment)
    } catch (error) {
      return res.status(500).send(error.message)
    }
  }
)

router.delete("/:gameId/comments/:commentId", checkToken, validateId("gameId", "commentId"), async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).send("game not found")

    const commentFound = await Comment.findById(req.params.commentId)
    if (!commentFound) return res.status(404).send("comment not found")

    const user = await User.findById(req.userId)

    if (user.role !== "Admin" && commentFound.owner != req.userId) return res.status(403).send("unauthorized action")

    await Game.findByIdAndUpdate(req.params.gameId, { $pull: { comments: commentFound._id } })

    await Comment.findByIdAndRemove(req.params.commentId)

    res.send("comment is removed")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

//------------------------------- Ratings --------------------------//

router.post("/:gameId/ratings", checkToken, validateId("gameId"), validateBody(ratingJoi), async (req, res) => {
  try {
    let game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).send("game not found")

    const { rating } = req.body

    const newRating = {
      rating,
      userId: req.userId,
    }

    const ratingFound = game.ratings.find(ratingObject => ratingObject.userId == req.userId)
    if (ratingFound) return res.status(400).send("user already rated this game")

    game = await Game.findByIdAndUpdate(req.params.gameId, { $push: { ratings: newRating } }, { new: true })

    let ratingSum = 0
    game.ratings.forEach(ratingObject => {
      ratingSum += ratingObject.rating
    })

    const ratingAverage = ratingSum / game.ratings.length

    await Game.findByIdAndUpdate(req.params.gameId, { $set: { ratingAverage } })

    res.send("rating added")
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

//-------------------------- Likes -------------------//

router.get("/:gameId/likes", checkToken, validateId("gameId"), async (req, res) => {
  try {
    let game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).send("game not found")

    const userFound = game.likes.find(like => like == req.userId)
    if (userFound) {
      await Game.findByIdAndUpdate(req.params.gameId, { $pull: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $pull: { likes: req.params.gameId } })

      res.send("removed like form game")
    } else {
      await Game.findByIdAndUpdate(req.params.gameId, { $push: { likes: req.userId } })
      await User.findByIdAndUpdate(req.userId, { $push: { likes: req.params.gameId } })
      res.send(" game liked")
    }
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

// --------------------- Tickets -------------------------//

router.get("/:ticketId/ticket", validateId("ticketId"), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId).populate("owner").populate("gameId")
    res.json(ticket)
  } catch (error) {
    console.log(error)
    res.status(500).send(error.message)
  }
})

router.post("/:gameId/tickets", checkToken, validateId("gameId"), validateBody(ticketJoi), async (req, res) => {
  try {
    // return res.send("hello")
    const { date } = req.body

    const game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).send("game not found")

    // صنعت التكت
    const newTicket = new Ticket({ date, owner: req.userId, gameId: req.params.gameId })
    await newTicket.save()

    await User.findByIdAndUpdate(req.userId, { $push: { tickets: newTicket._id } })

    // صنعت الباركود
    const opts = {
      errorCorrectionLevel: "H",
      type: "terminal",
      quality: 0.95,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFF",
      },
    }
    const qrImage = await QRCode.toDataURL(`http://localhost:3000/ticket/${newTicket._id}`, opts)
    await Ticket.findByIdAndUpdate(newTicket._id, { $set: { qrcode: qrImage } }) // اضفت الباركود لتكت

    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      auth: {
        user: "ageelnajwa@gmail.com",
        pass: "N12345678!",
      },
    })

    // أوجد اليوزر عشان اطلع ايميله وارسل عليه الباركود
    const user = await User.findById(req.userId)
    await transporter.sendMail({
      from: `"Disney Park" <ageelnajwa@gmail.com>`,
      to: user.email,
      subject: "Ticket verification",

      html: `Hello, please click on this link to your Ticket.
        <a href="http://localhost:3000/ticket/${newTicket._id}" > View Ticket </a>
        <img src="${qrImage}"/>`,
    })
    return res.send(qrImage)
    res.json(newTicket)
  } catch (error) {
    console.log(error)
    return res.status(500).send(error.message)
  }
})

module.exports = router
