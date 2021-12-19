

const validateBody = elementJoi => {
  return async (req, res, next) => {
    const result = elementJoi.validate(req.body)
    if (result.error) return res.status(400).send(result.error.message)

    next()
  }
}

module.exports = validateBody
