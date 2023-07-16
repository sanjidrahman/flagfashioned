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


module.exports = {
    cancelOrder,
    returnOrder
}