const Address = require('../models/addressModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Coupon = require('../models/couponModel')
const Razorpay = require('razorpay');
const { update } = require('./orderController')
const { log } = require('console')

var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
});

const loadAddAddress = async (req, res, next) => {
    try {

        res.render('check-add-address', { session: req.session.user_id })

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

const loadEditAddAddress = async (req, res, next) => {
    try {

        const id = req.session.user_id
        const address_id = req.query.addressId

        const addressdata = await Address.findOne({ user: id }, { addresses: { $elemMatch: { _id: address_id } } });
        res.render('checkout-edit-address', { address: addressdata.addresses[0], session: req.session.user_id })

    } catch (err) {
        next(err.message)
    }
}

const editAddress = async (req, res, next) => {
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
        const address = await Address.findOne({ user: userId })

        if (address.addresses.length === 1) {

            const daddress = await Address.deleteOne({ user: userId })

            res.json({ success: true })

        } else {

            const daddress = await Address.findOneAndUpdate(
                { user: userId, 'addresses._id': addressId },
                { $pull: { addresses: { _id: addressId } } }
            );
            if (daddress) {
                res.json({ success: true });
            } else {
                res.json({ success: false })
            }

        }

    } catch (err) {
        next(err);
    }
}


const placeOrder = async (req, res, next) => {
    try {

        const code = req.body.code
        const bodyaddress = req.body.selectedAddress
        const total = req.body.total
        const grand = req.body.grand
        const payment = req.body.payment
        // const checkstat = req.body.checkstat

        let status = payment == 'cod' ? 'placed' : 'pending'

        // if(checkstat == true) {
        //     status = payment + 'wallet'
        // }

        userId = req.session.user_id
        const user = await User.findOne({ _id: userId })
        const coupon = await Coupon.findOne({ code: code })

        const cartData = await Cart.findOne({ user: userId })
        const cartProducts = cartData.products

        const orderDate = new Date();
        const delivery = new Date(orderDate.getTime() + (10 * 24 * 60 * 60 * 1000));
        const deliveryDate = delivery.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).replace(/\//g, '-');

        if (coupon) {
            const minus = coupon.discountPercentage / 100
            for (i = 0; i < cartProducts.length; i++) {
                const productId = cartProducts[i].productId
                const total = cartProducts[i].quantity * cartProducts[i].price
                await Cart.findOneAndUpdate({ user: req.session.user_id, 'products.productId': productId }, {
                    $set: { 'products.$.totalPrice': Math.ceil(total - (total * minus)) }
                })
            }
        }

        const cartDataa = await Cart.findOne({ user: userId })
        const cartProductss = cartDataa.products

        if( total == 0 ) {
            const order = new Order({
                user: userId,
                deliveryAddress: bodyaddress,
                userName: user.name,
                totalAmount: total,
                status: 'placed',
                date: orderDate,
                payment: 'wallet',
                products: cartProductss,
                expectedDelivery: deliveryDate,
            })
    
            const orderData = await order.save()
            const orderid = orderData._id

            await Cart.deleteOne({ user: req.session.user_id })
            await Coupon.findOneAndUpdate({ code: code }, { $push: { user: req.session.user_id } });
            await User.findOneAndUpdate({ _id : req.session.user_id } , {$inc : { wallet : -grand }})

            for (let i = 0; i < cartProducts.length; i++) {
                const productId = cartProducts[i].productId
                const count = cartProducts[i].quantity
                const product = await Product.findOne({ _id : productId })
                if(product.stock !==0 ){
                    await Product.findByIdAndUpdate({ _id: productId }, { $inc: { stock: -count } })
                }
            }

            return res.json({ success: true, params: orderid })
        }

        const order = new Order({
            user: userId,
            deliveryAddress: bodyaddress,
            userName: user.name,
            totalAmount: total,
            status: status,
            date: orderDate,
            payment: payment,
            products: cartProductss,
            expectedDelivery: deliveryDate,
        })

        const orderData = await order.save()
        const orderid = orderData._id

        if (orderData.status === 'placed') {
            await Cart.deleteOne({ user: req.session.user_id })
            await Coupon.findOneAndUpdate({ code: code }, { $push: { user: req.session.user_id } });

            for (let i = 0; i < cartProducts.length; i++) {
                const productId = cartProducts[i].productId
                const count = cartProducts[i].quantity
                const product = await Product.findOne({ _id : productId })
                if(product.stock !==0 ){
                    await Product.findByIdAndUpdate({ _id: productId }, { $inc: { stock: -count } })
                }
            }


            res.json({ success: true, params: orderid })
        } else {

            const orderId = orderData._id
            const total = orderData.totalAmount

            var options = {
                amount: total * 100,
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


const verifypayment = async (req, res, next) => {
    try {

        const code = req.body.code
        let userData = await User.findOne({ _id: req.session.user_id })
        const cartData = await Cart.findOne({ user: req.session.user_id })
        const cartProducts = cartData.products

        const details = (req.body);

        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", process.env.KEY_SECRET)
        hmac.update(details.payment.razorpay_order_id + '|' + details.payment.razorpay_payment_id)
        hmac = hmac.digest('hex')
        if (hmac == details.payment.razorpay_signature) {
            await Order.findByIdAndUpdate(
                { _id: details.order.receipt },
                { $set: { paymentId: details.payment.razorpay_payment_id } })

            // decrease stock amount 
            for (let i = 0; i < cartProducts.length; i++) {
                const productId = cartProducts[i].productId
                const count = cartProducts[i].quantity
                await Product.findByIdAndUpdate({ _id: productId }, { $inc: { stock: -count } })
            }

            await Order.findByIdAndUpdate({ _id: details.order.receipt }, { $set: { status: "placed" } })
            await Cart.deleteOne({ user: userData._id })
            await Coupon.findOneAndUpdate({ code: code }, { $push: { user: req.session.user_id } });
            res.json({ success: true, params: details.order.receipt })
        } else {
            await Order.deleteOne({ _id: details.order.receipt });
            res.json({ success: false });

        }

    } catch (err) {
        next(err.message)
    }
}

const wallet = async (req, res, next) => {
    try {

        let total = req.body.total;
        console.log(total);

        const user = await User.findOne({ _id: req.session.user_id });
        const wallet = user.wallet;

        if (wallet > total) {
            console.log('1');
            total = 0;  
        } else {
            total = Math.abs(wallet - total); 
        }

        res.json({ success: true, total });


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
    verifypayment,
    wallet
}