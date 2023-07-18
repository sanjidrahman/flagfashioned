const Address = require('../models/addressModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Razorpay = require('razorpay');

var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET,
});

const loadAddAddress = async (req, res, next) => {
    try {

        res.render('check-add-address' , { session : req.session.user_id })

    } catch (err) {
        next(err.message);
    }
}

const checkoutAddAddress = async (req, res, next) => {
    try {

        const userId = req.session.user_id;

        const address = await Address.findOne({ user: userId });

        if (address) {
            await Address.updateOne(
                { user: userId },
                {
                    $push: {
                        addresses: {
                            fname: req.body.name,
                            lname: req.body.lname,
                            phone: req.body.phone,
                            address: req.body.address,
                            city: req.body.city,
                            pin: req.body.pin
                        }
                    }
                }
            );
        } else {
            const newAddress = new Address({
                user: userId,
                addresses: [{
                    fname: req.body.name,
                    lname: req.body.lname,
                    phone: req.body.phone,
                    address: req.body.address,
                    city: req.body.city,
                    pin: req.body.pin
                }]
            });
            await newAddress.save();
        }

        res.redirect('/checkout');
    } catch (err) {
        next(err);
    }
}

const loadEditAddAddress = async (req , res , next) => {
    try {

        const id = req.session.user_id
        const address_id = req.query.addressId

        const addressdata = await Address.findOne({ user: id }, { addresses: { $elemMatch: { _id: address_id } } });
        res.render('checkout-edit-address', { address: addressdata.addresses[0] , session : req.session.user_id })
        
    } catch (err) {
        next(err.message)
    }
}

const editAddress = async (req , res , next) => {
    try {

        const id = req.session.user_id
        const address_id = req.body.addressId

        const data = await Address.findOneAndUpdate(
            { user: id, "addresses._id": address_id },
            {
                $set: {
                    "addresses.$.fname": req.body.fname,
                    "addresses.$.lname": req.body.lname,
                    "addresses.$.phone": req.body.phone,
                    "addresses.$.address": req.body.address,
                    "addresses.$.city": req.body.city,
                    "addresses.$.pin": req.body.pin,
                },
            }
        );

        res.redirect('/checkout')
        
    } catch (err) {
        next(err.messsage)
    }
}

const deleteAddress = async (req, res, next) => {
    try {
        const addressId = req.body.addressId;
        const userId = req.session.user_id;
        const address = await Address.findOne({ user : userId })

        if(address.addresses.length === 1 ) {

            const daddress = await Address.deleteOne({ user : userId})

            res.json({ success : true })

        } else {

            const daddress = await Address.findOneAndUpdate(
                { user: userId, 'addresses._id': addressId },
                { $pull: { addresses : { _id : addressId } } }
            );
            if(daddress) {
                res.json({ success: true });
            }else{
                res.json({ success : false })
            }  

        }

    } catch (err) {
        next(err);
    }
}


const placeOrder = async (req , res , next) => {
    try {

        const bodyaddress = req.body.selectedAddress
        const total = req.body.total
        const payment = req.body.payment
        
       let status = payment == 'cod' ? 'placed' : 'pending'

        userId = req.session.user_id
        const user = await User.findOne({ _id : userId })
        const cartData = await Cart.findOne({ user : userId })

        const cartProducts = cartData.products

        const orderDate = new Date(); 
        const delivery = new Date(orderDate.getTime() + (10 * 24 * 60 * 60 * 1000)); // Add 10 days to the order date
        const deliveryDate = delivery.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).replace(/\//g, '-');

        const order = new Order({
            user : userId,
            deliveryAddress : bodyaddress,
            userName : user.name,
            totalAmount : total,
            status : status,
            date : orderDate,
            payment : payment,
            products : cartProducts,
            expectedDelivery : deliveryDate
        })

        const orderData = await order.save() 
        const orderid = orderData._id

        if(orderData.status === 'placed') {
            await Cart.deleteOne({ user : req.session.user_id})
           for(let i=0 ; i< cartProducts.length ; i++) {
            const productId = cartProducts[i].productId
            const count = cartProducts[i].quantity
            await Product.findByIdAndUpdate({ _id : productId } , { $inc : { quantity : -count }})
           }
            
           res.json({ success : true , params : orderid })
        }else{

            const orderId = orderData._id
            const total = orderData.totalAmount

            var options = {
                amount: total * 100 ,
                currency: 'INR',
                receipt: '' + orderId,
              };
      
            instance.orders.create(options, function (err, order) {
                
                res.json({ order });
                
            });
        }
        
    } catch (err) {
        next(err.message)
    }
}


const verifypayment = async (req, res , next) => {
    try {
        let userData = await User.findOne({ _id : req.session.user_id })

        const details = (req.body);

        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET)
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
        hmac = hmac.digest('hex')
        if (hmac == details.payment.razorpay_signature) {
            await Order.findByIdAndUpdate({
                _id: details.order.receipt
            },
                { $set: { paymentId: details.payment.razorpay_payment_id } })

            const data = await Order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "placed" } })
            await Cart.deleteOne({ user: userData._id })
            res.json({ success: true , params : details.order.receipt })
        } else {
            await Order.deleteOne({ _id: details.order.receipt });
            res.json({ success: false }); 

        }

    } catch (err) {
        next(err.message)
    }
}

module.exports = {
    checkoutAddAddress,
    loadAddAddress,
    loadEditAddAddress,
    editAddress,
    deleteAddress,
    placeOrder,
    verifypayment
}