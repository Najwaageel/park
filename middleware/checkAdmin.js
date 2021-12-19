const jwt = require("jsonwebtoken")
const { User } = require("../models/User")

const checkAdmin = async (req, res, next) => {
  const token = req.header("Authorization")
  if (!token) return res.status(401).send("token is missing") 

  const decryptedToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
  const userId = decryptedToken.id

  const adminFound = await User.findById(userId)
  if (!adminFound) return res.status(404).send("user not found")
  
  if (adminFound.role !=="Admin") return res.status(403).send("you are not admin")
  next()

}

module.exports = checkAdmin