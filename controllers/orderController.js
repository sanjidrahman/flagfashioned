const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')


const cancelOrder = async (req , res , next) => {
    try {

        const reason = req.body.reason
        const id = req.body.crId

        const orderData = await Order.findOne({ 'products._id' : id })
        const product = orderData.products.find((product) => product._id.toString() === id )

        const cancel = await Order.findOneAndUpdate({ user : req.session.user_id , 'products._id' : id } , { $set : {
            'products.$.status' : 'Cancelled' ,
            'products.$.cancelReason' : reason
        }})

        if(cancel) {
            res.json({ success : true})
        }else{
            res.json({ success : false })
        }
        
    } catch (err) {
        next(err.message)
    }
}

const returnOrder = async (req , res , next) => {
    try {

        const reason = req.body.reason
        const id = req.body.crId

        const orderData = await Order.findOne({ 'products._id' : id })
        const product = orderData.products.find((product) => product._id.toString() === id )

        const curr_date = new Date()
        const cancel = await Order.findOneAndUpdate({ user : req.session.user_id , 'products._id' : id } , { $set : {
            'products.$.status' : 'cancelled' ,
            'products.$.cancelReason' : reason
        }})

        if(cancel) {
            res.json({ success : true})
        }else{
            res.json({ success : false })
        }
        
    } catch (err) {
        next(err.message)
    }
}


// ------------ ADMIN SIDE ------------

const loadOrder = async (req , res , next) => {
    try {

        var pages = 1
        if(req.query.pages) {
            pages = req.query.pages
        }

        const limit = 3

        const orders = await Order.find({})
        .limit(limit * 1)
        .skip((pages - 1) * limit)

        const count = await Order.find({}).sort({ date : -1 })
        .countDocuments()
        
        res.render('orders' , { orders  , count})

    } catch (err) {
        next(err.message)
    }
}


const orderDetails = async (req , res , next) => {
    try {

        const orderId = req.query.id
        const order = await Order.findOne({ _id : orderId }).populate('products.productId')

        res.render('order-details' , { order })
        
    } catch (err) {
        next(err.message)
    }
}

const update = async(req , res , next) => {
    try {

        const productId = req.body.pid
        const orderId = req.body.oid
        const status = req.body.status
   
        const orderData = await Order.findOneAndUpdate({ _id : orderId , 'products._id' : productId } , 
        {
            $set : 
            {
                'products.$.status' : status
            }
        })
       
        res.redirect(`/admin/order-detail?id=${orderId}`)
        
    } catch (err) {
        next(err.message)
    }
}


module.exports = {
    cancelOrder,
    returnOrder,
    loadOrder,
    orderDetails,
    update
}