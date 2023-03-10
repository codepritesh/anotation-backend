const { Quiz, User, UploadedFile, Orders } = require('../models')
const optionsInvoice = require('../helpers/optionsInvoice')
const pdf = require('pdf-creator-node')
const path = require('path')
const ejs = require('ejs')
const ApiError = require('../helpers/APIError')
const fs = require('fs')
const { uploadPdf } = require('../middlewares/upload')
const { baseFrontendUrl } = require('../../../config/constants')

const freePlan = {
  quizPerMonth: 1,
  maxDocuments: 2,
  maxStudents: 0,
  maxSizePerQuiz: 5,
  maxQues: 5
}

const checkPlanLimit = async (user, quizData) => {
  let plan
  if (!user || !user.subscription || user.subscription.length === 0) {
    plan = freePlan
  } else {
    plan = user.subscription[user.subscription.length - 1]
  }
  await helperCheckLimit(plan, user, quizData)
}

const updateSubscription = async (userId) => {
  let plan
  const user = await User.findById(userId)
  const todaysDate = new Date()
  if ((!user.subscription) || user.subscription.length === 0) {
    await User.findByIdAndUpdate(user._id, { $set: { activeSubscription: false } })
  } else {
    plan = user.subscription[user.subscription.length - 1]
    if (todaysDate > plan.endDate) {
      await User.findByIdAndUpdate(user._id, { $set: { activeSubscription: false } })
    } else {
      await User.findByIdAndUpdate(user._id, { $set: { activeSubscription: true } })
      await user.save()
    }
  }
}

const getNumOfQuizCreated = async (user) => {
  // TODO change this
  if (!user) return 0
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  const numQuiz = await Quiz.countDocuments({ creatorId: user._id, createdAt: { $gte: d } })
  return numQuiz
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const helperCheckLimit = async (plan, user, quizData) => {
  if (user && (!user.subscription || user.subscription.length === 0)) { throw new ApiError('You are not subscribed to any plan', 410) }
  const numQuiz = getNumOfQuizCreated(user)
  const sizes = await Promise.all(quizData.urls.map(url => {
    return UploadedFile.findOne({ url: url })
  }))
  const size = sizes.reduce((acc, cur) => acc + cur.size, 0)
  console.log(size)
  if (plan.maxQues && (plan.maxQues < quizData.subQues || quizData.objQues > plan.maxQues_)) {
    throw new ApiError('You have exceeded the maximum number of questions per quiz', 410)
  }
  if (size > plan.maxSizePerQuiz) {
    throw new ApiError(`Max size limit for quiz according to plan is ${plan.maxSizePerQuiz}`, 410)
  }
  if (numQuiz >= plan.quizPerMonth) {
    throw new ApiError(`You have reached the limit of ${plan.quizPerMonth} quiz per month`, 410)
  }
  if (quizData.urls.length > plan.maxDocuments) {
    throw new ApiError(`You have reached the limit of ${plan.maxDocuments} documents per quiz`, 410)
  }
}

const invoiceEmail = async (user, sub) => {
  const order = await Orders.findOne({ _id: sub.orderId }).lean() // njsscan-ignore: node_nosqli_injection
  let htmldata
  const temPath = path.join(__dirname, '../../../views/InvoiceNew.ejs')
  const paymentMethod = order.paymentDetails[0].method ? order.paymentDetails[0].method : 'Not Required'
  let cardDetData
  if (paymentMethod === 'card') {
    const cardDet = order.paymentDetails[0].card
    cardDetData = cardDet.network + ' ****' + cardDet.last4
  } else {
    cardDetData = paymentMethod
  }
  const templateData = {
    name: sub.name,
    startDate: sub.startDate.toLocaleDateString(),
    endDate: sub.endDate.toLocaleDateString(),
    orderId: order.orderStr,
    planId: sub.planId,
    quizPerMonth: sub.quizPerMonth,
    maxDocuments: sub.maxDocuments,
    maxStudents: sub.maxStudents,
    planAmount: sub.planAmount,
    paidamount: sub.paidamount,
    userEmail: user.email,
    userName: user.firstName + ' ' + user.lastName,
    receipt: order.receipt,
    duration: order.planType,
    gstAmount: (sub.planAmount * 0.18).toFixed(2),
    paymentMethod: cardDetData,
    contactNumber: order.paymentDetails[0].contact ? order.paymentDetails[0].contact : 'Contact Number Not Available',
    baseUrl: baseFrontendUrl
  }
  ejs.renderFile(temPath, templateData, (err, html) => {
    if (err) console.log(err) // Handle error
    htmldata = html
  })

  const filename = sub.orderId + '_Invoice' + '.pdf'
  const filePath = path.join(__dirname, '../../../public/Files/') + filename
  const document = {
    html: htmldata,
    data: {
      message: 'dummy',
      show_answer: 'show'
    },
    path: filePath
  }
  const responseData = {}
  await pdf.create(document, optionsInvoice).then(resd => {
  }).catch(error => {
    console.log(error)
  })

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath)
    const returns3 = await uploadPdf(fileContent, filename)
    if (returns3.status_d === 0) {
      responseData.message = 's3 upload failed-' + returns3.data
      responseData.status = 0
    } else {
      const userData = await User.findById(user._id)
      const lastsub = userData.subscription.length - 1
      const objUpdate = {}
      const updateQuery = 'subscription.' + lastsub + '.invoice'
      objUpdate[updateQuery] = returns3.data.Location

      await User.findByIdAndUpdate(user._id, { $set: objUpdate })
      responseData.message = 's3 upload done'
      responseData.status = 1
      responseData.invoicePath = returns3.data.Location
    }
    fs.unlinkSync(filePath)
  } else {
    responseData.message = 'pdf creation failed for invoice '
    responseData.status = 0
    responseData.invoicePath = '#'
  }
  return responseData
}

module.exports = {
  checkPlanLimit,
  updateSubscription,
  invoiceEmail,
  sleep
}
