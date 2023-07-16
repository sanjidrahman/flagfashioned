const User = require('../models/userModel')
const Wishlist = require('../models/wishlistModel')
const Cart = require('../models/cartModel')
const Product = require('../models/productModel')


const addWishlist = async (req, res, next) => {
    try {

        const product = req.body.proId
        const userId = req.session.user_id

        const wishData = await Wishlist.findOne({ user: userId })

        if (wishData) {
            const existProduct = await Wishlist.findOne({ user: userId, 'products.productId': product })
            console.log(existProduct);
            if (existProduct) {
                res.json({ success: false, message: 'Product already exists' })

            } else {
                await Wishlist.findOneAndUpdate({ user: userId }, { $push: { products: { productId: product } } })
                res.json({ success: true })
            }

        } else {

            const wishlist = new Wishlist({
                user: userId,
                products: [{
                    productId: product
                }]
            })

            const newWish = await wishlist.save()
            if (newWish) {
                res.json({ success: true })
            } else {
                res.json({ success: false, message: 'Something went wrong' })
            }
        }

    } catch (err) {
        next(err.message)
    }
}


const addToCart = async (req, res, next) => {
    try {

        const productId = req.body.proId
        const cartData = await Cart.findOne({ user: req.session.user_id })
        const wishData = await Wishlist.findOne({ user : req.body.user_id })
        const product = await Product.findOne ({ _id : productId })

        if (cartData) {
            const exist = cartData.products.find((pro) => pro.productId.toString() === productId)
            if (exist) {
                res.json({ success: false, message: 'Product is already in cart' })
            } else {
                const total = 1 * product.price
                await Cart.findOneAndUpdate({ user: req.session.user_id },
                {
                    $push: {
                        products: {
                            productId: productId,
                            price: product.price,
                            totalPrice: total
                        }
                    }
                })
                
                res.json({ success : true })
            }
        }else{
            const total = 1 * product.price
            const cart = new Cart({
                user : req.session.user_id,
                products : [{
                    productId : productId,
                    price: product.price,
                    totalPrice: total
                }]
            })

            const cartData = await cart.save()

            if(cartData) {
                res.json({ success : true })
            }else{
                res.json({ success : false , message : 'Something fuked' })
            }
        }


    } catch (err) {
        next(err.message)
    }
}

const deleteWishlist = async (req , res , next) => {
    try {

        const productId = req.body.proId
        const wishData = await Wishlist.findOne({ user : req.session.user_id })
        console.log(wishData);
        console.log(wishData.products.length);

        if(wishData.products.length === 1) {
            await Wishlist.deleteOne({ user : req.session.user_id})
            
            res.json({ success : true })
        }else{
            await Wishlist.findOneAndUpdate({ user : req.session.user_id } , {
                $pull : { products : { productId : productId }}
            })

            res.json({ success : true })
        }
        
    } catch (err) {
        next(err.message)
    }
}

module.exports = {
    addWishlist,
    addToCart,
    deleteWishlist
}