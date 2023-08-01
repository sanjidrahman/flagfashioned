const User = require('../models/userModel')
const Product = require('../models/productModel')
const Cart = require('../models/cartModel')


const loadCart = async (req, res, next) => {
    try {

        const cartData = await Cart.findOne({ user: req.session.user_id }).populate('products.productId')

        let total = 0

        if (cartData) {

            cartData.products.forEach((product) => {
                total = total + product.price * product.quantity
            })
            res.render('cart', { session: req.session.user_id, cart: cartData, total: total })
        } else {
            res.render('cart', { session: req.session.user_id, cart: [], total: total })
        }

    } catch (err) {
        next(err.message)
    }
}

const addToCart = async (req, res, next) => {
    try {

        const productId = req.body.productId
        const userId = await User.findOne({ _id: req.session.user_id })
        const product = await Product.findOne({ _id: productId })

        const cart = await Cart.findOne({ user: userId }) 

        if (cart) {
            const existProduct = cart.products.find((product) => product.productId.toString() === productId)
            if (existProduct) {

                await Cart.findOneAndUpdate({ user: userId, 'products.productId': productId },
                    {
                        $inc: {
                            'products.$.quantity': req.body.quantity,
                            'products.$.totalPrice': req.body.quantity * product.price
                        }
                    })
            } else {
                const total = req.body.quantity * product.price
                await Cart.findOneAndUpdate({ user: userId },
                    {
                        $push: {
                            products: {
                                productId: req.body.productId,
                                quantity: req.body.quantity,
                                price: product.price,
                                totalPrice: total 
                            }
                        }
                    })
            }

        } else {
            const total = req.body.quantity * product.price
            const cartData = new Cart({
                user: req.session.user_id,
                products: [{
                    productId: productId,
                    quantity: req.body.quantity,
                    price: product.price,
                    totalPrice: total
                }]
            })

            const cart = await cartData.save()
        }

        res.json({ success: true })

    } catch (err) {
        next(err.message)
    }
}

const deleteCart = async (req, res, next) => {
    try {

        const product = req.body.prid
        const cartData = await Cart.findOne({ user: req.session.user_id })

        if (cartData.products.length === 1) {
            await Cart.deleteOne({ user: req.session.user_id })
        } else {
            await Cart.updateOne({ user: req.session.user_id },
                { $pull: { products: { _id: product } } })
        }

        res.json({ success: true })

    } catch (err) {
        next(err.message)
    }
}

const changes = async (req, res, next) => {
    try {
        const count = req.body.count;
        const cartId = req.body.cartId;
        const productId = req.body.productId;

        const cart = await Cart.findOne({ user: req.session.user_id });
        const product = await Product.findOne({ _id: productId });

        const cartProduct = cart.products.find(
            (product) => product.productId.toString() === productId
        );

        if (count == 1) {
            if (cartProduct.quantity < product.stock) {
                await Cart.updateOne(
                    { user: req.session.user_id, 'products.productId': productId }, {
                        $inc: {
                            'products.$.quantity': 1,
                            'products.$.totalPrice': product.price
                        }
                })
                res.json({ success: true });
            } else {
                res.json({ success: false, message: `The maximum quantity available for this product is ${product.stock} . Please adjust your quantity.` })
            }
        } else if (count == -1) {
            if (cartProduct.quantity > 1) {
                await Cart.updateOne(
                    { user: req.session.user_id, 'products.productId': productId }, {
                    $inc: {

                        'products.$.quantity': -1,
                        'products.$.totalPrice': -product.price
                    }
                })

                res.json({ success: true })

            } else {
                res.json({ success: false, message: 'Cannot decrement the quantity anymore' })
            }
        } else {
            res.json({ success: false, message: 'Invalid count value' })
        }
    } catch (err) {
        next(err.message);
    }
}



module.exports = {
    loadCart,
    addToCart,
    deleteCart,
    changes
}