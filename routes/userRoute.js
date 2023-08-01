const express = require('express')
const user_route = express()
const userController = require('../controllers/userController')
const addressController = require('../controllers/addressController')
const cartController = require('../controllers/cartController')
const checkoutController = require('../controllers/checkoutController')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController')
const couponController = require('../controllers/couponController')
const auth = require('../middleware/userAuth')
const nocache = require('nocache')


user_route.set('view engine' , 'ejs')
user_route.set('views' , './views/user')

user_route.use(nocache())

user_route.get('/' ,   userController.loadHome)
user_route.get('/shop' ,  userController.loadShop)
user_route.post('/shop' ,  userController.loadShop)
user_route.get('/login' , userController.loadLogin)
user_route.post('/login' , userController.verifyLogin)
user_route.get('/register' , userController.loadRegister)
user_route.post('/register' , userController.registerUser)
user_route.get('/otp' , userController.loadOtp)
user_route.post('/otp' , userController.verifyOtp)
user_route.get('/otp-resend' , userController.resend)
user_route.get('/shop-details' , userController.loadShopDetails)
user_route.get('/profile' , auth.isLogin , auth.isBlock , userController.loadProifle)
user_route.post('/updateProfile' , userController.updateProfile)
user_route.get('/change-passsword' , userController.loadChangePass)
user_route.post('/change-password' , userController.changePass)
user_route.get('/checkout' , auth.isLogin , userController.loadCheckOut)
user_route.get('/order-placed/:id' , userController.loadOrderPlaced)
user_route.get('/order-details/:id' , auth.isLogin , auth.isBlock , userController.loadOrderDetails)
user_route.get('/wishlist' , auth.isLogin , auth.isBlock , userController.loadWishlist)
user_route.get('/logout' , userController.logout)
user_route.post('/review' , userController.review)


user_route.post('/deleteAddress' , addressController.deleteAddress)
user_route.get('/add-address' , addressController.loadAddAddress)
user_route.post('/add-address' , addressController.addAddress)
user_route.get('/edit-address' , addressController.loadEditAddress)
user_route.post('/edit-address' , addressController.editAddress)


user_route.get('/cart' , auth.isLogin , auth.isBlock , cartController.loadCart)
user_route.post('/addToCart' , auth.isLogin , cartController.addToCart)
user_route.post('/deleteProducts' ,cartController.deleteCart)
user_route.post('/changes' , cartController.changes)


user_route.get('/add-addresss' , checkoutController.loadAddAddress)
user_route.post('/add-addresss' , checkoutController.checkoutAddAddress)
user_route.get('/check-edit-address' , checkoutController.loadEditAddAddress)
user_route.post('/check-edit-address' , checkoutController.editAddress)
user_route.post('/checkout-delete' , checkoutController.deleteAddress)
user_route.post('/checkout' , checkoutController.placeOrder)
user_route.post('/verifypayment' , checkoutController.verifypayment)

// user_route.post('/coupon' , userController.coupon)

user_route.post('/cancel-order' , orderController.cancelOrder)
user_route.post('/return-order' , orderController.returnOrder)


user_route.post('/addToWish' , wishlistController.addWishlist)
user_route.post('/wish-cart' , wishlistController.addToCart)
user_route.post('/wish-delete' , wishlistController.deleteWishlist)





module.exports =  user_route
