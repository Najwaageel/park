const mongoose = require("mongoose")

const checkId = async (req, res, next) => {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("the path id is not a valid object id")

    next()
}
module.exports = checkId