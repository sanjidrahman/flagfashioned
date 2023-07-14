const Address = require('../models/addressModel')
const User = require('../models/userModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')

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
        console.log(bodyaddress);
        const total = req.body.total
        const payment = req.body.payment
        
       let status = payment == 'cod' ? 'fulfilled' : 'pending'

        userId = req.session.user_id
        const user = await User.findOne({ _id : userId })
        const cartData = await Cart.findOne({ user : userId })

        const cartProducts = cartData.products

        const orderDate = new Date()
        const delivery = new Date()
        delivery.setDate(orderDate.getDate() + 10)
        console.log(delivery);
      

        const order = new Order({
            user : userId,
            deliveryAddress : bodyaddress,
            userName : user.name,
            totalAmount : total,
            status : status,
            date : orderDate,
            payment : payment,
            products : cartProducts,
            expectedDelivery : delivery
        })

        const orderData = await order.save() 
        const orderid = orderData._id

        if(orderData) {
            await Cart.deleteOne({ user : req.session.user_id})
            res.redirect("/order-placed/"+orderid)
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
    placeOrder
}