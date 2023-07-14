const User = require('../models/userModel')
const Wishlist = require('../models/wishlistModel')


const addWishlist = async (req, res, next) => {
    try {

        const product = req.body.proId
        const userId = req.session.user_id

        const wishData = await Wishlist.findOne({ user: userId })

        if (wishData) {
            const existProduct = await Wishlist.findOne({ user : userId , 'products.productId' : product })
            console.log(existProduct);
            if (existProduct) {
                res.json({ success: false, message: 'Product already exists' })

            } else {
                await Wishlist.findOneAndUpdate({ user: userId }, { $push: { products: { productId : product } } })
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

module.exports = {
    addWishlist
}