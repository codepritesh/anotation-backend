const catchAsync = require('../helpers/catchAsync')
const { Databuilder } = require('../models')

exports.getByIndex = catchAsync(async (req, res, next) => {
  console.log(req.body)
  const { index } = req.body
  const questionData = await Databuilder.findOne({ index: index }) // njsscan-ignore: node_nosqli_injection
  if (questionData) {
    return res.status(200).json({
      questionData: questionData
    })
  }
  return res.status(404).json({
    message: "data not found"
  })
})

exports.update = catchAsync(async (req, res, next) => {
  const { _id, answer,answer_start,context, index,question,validated} = req.body
  console.log(index,_id)
  const updateQuestion = await Databuilder.findByIdAndUpdate(_id,
    {
      $set: { answer: answer, answer_start:answer_start, context:context, question:question,validated:validated },
    })

    return res.status(200).json({
      message: "data update successfully"
    })
 
})