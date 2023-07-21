const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Wishlist = require('../models/wishlistModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')


let otp;
let userEmail;
let userName;

const securepassword = async (password) => {
    try {

        const securepassword = await bcrypt.hash(password, 10)
        return securepassword

    } catch (err) {
        console.log(err.message);
    }
}

const sendVerifyMail = async (name, email, otp) => {
    try {

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.USER,
                pass: process.env.PASS
            },
        })

        const mailOptions = {
            from: process.env.USER,
            to: email,
            subject: 'For Email Verification',
            html: '<p> Hi ' + name + ' , please enter ' + otp + ' for your OTP verification'
        }
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err.message);
            } else {
                console.log(otp + 'Email has been sent', info.response);
            }
        })

    } catch (err) {
        console.log(err.message);
    }
}


const loadHome = async (req, res) => {
    try {

        const product = await Product.find({ is_delete: 0 })
        res.render('home', { products: product, session: req.session.user_id })

    } catch (err) {
        console.log(err.message);
    }
}

const loadShop = async (req, res) => {
    try {

        var search = ''
        if(req.query.search) {
            search = req.query.search
        }

        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        const limit =  6

        const category = await Category.find({ is_delete: false })
        
        const product = await Product.find({ is_delete: 0  ,
            name : { $regex : '.*'+search+'.*' , $options : 'i' 
        }})
        .limit(limit * 1)
        .skip((page -1) * limit)
        .exec()

        const count = await Product.find({ is_delete: 0  ,
            name : { $regex : '.*'+search+'.*' , $options : 'i' 
        }}).countDocuments()
        

        res.render('shop', { 
            categories: category,
            products: product,
            session: req.session.user_id,
            totalPages : Math.ceil(count / limit),
            currentPage : page
         })

    } catch (err) {
        console.log(err.message);
    }
}

const loadLogin = async (req, res) => {
    try {

        res.render('login')

    } catch (err) {
        console.log(err.message);
    }
}

const loadRegister = async (req, res) => {
    try {

        res.render('register')

    } catch (err) {
        console.log(err.message);
    }
}


const loadOtp = async (req, res) => {

    try {

        res.render('otp-page')

    } catch (err) {
        console.log(err.message);
    }
}

const registerUser = async (req, res) => {
    const existmail = await User.findOne({ email: req.body.email })
    if (existmail) {
        res.render('register', { message: 'already exists' })
    } else {
        try {

            const email = req.body.email
            const name = req.body.name
            userEmail = email
            userName = name

            const spassword = await securepassword(req.body.password)
            const user = new User({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                password: spassword
            })

            const userData = await user.save()

            if (userData) {

                const generateOtp = Math.floor(1000 + Math.random() * 9999)
                otp = generateOtp

                sendVerifyMail(req.body.name, req.body.email, otp)
                
                res.render('otp-page', { isTimerExpired: false })
            } else {
                res.render('register', { message: 'oops , something went wrong' })
            }

        } catch (err) {
            console.log(err.message);
        }
    }
}

const verifyOtp = async (req, res) => {

    try {

        const curr_otp = req.body.otp

        if (otp == curr_otp) {
            const userData = await User.findOneAndUpdate({ email: userEmail }, { $set: { is_verified: 1 } })
            res.render('login', { message: 'Registered Successfully , Please Login' })
        } else {
            res.render('otp-page', { message: 'incorrect otp' })
        }

    } catch (err) {
        console.log(err.message);
    }
}

const resend = async (req, res) => {
    try {

        const generateOtp = Math.floor(1000 + Math.random() * 9999)
        otp = generateOtp

        sendVerifyMail(userName, userEmail, otp)
        res.render('otp-page')

    } catch (err) {
        console.log(err.message);
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({ email: email });

        if (userData === null) {
            res.render('login', { message: 'User does not exist' });
        } else if (userData.is_verified === 1) {
            if (userData.is_blocked === 0) {
                if (userData.email) {
                    const isPasswordCorrect = await bcrypt.compare(password, userData.password);

                    if (isPasswordCorrect) {
                        req.session.user_id = userData._id;
                        res.redirect('/');
                    } else {
                        res.render('login', { message: 'Email or password incorrect' });
                    }
                } else {
                    res.render('login', { message: 'Email and password incorrect' });
                }
            } else {
                res.render('login', { message: "You can't access the webpage anymore" });
            }
        } else {
            res.render('login', { message: 'You are not verified' });
        }
    } catch (err) {
        console.log(err.message);
    }
}

const loadShopDetails = async (req, res) => {
    try {

        const id = req.query.id
        const product = await Product.find({ _id: id })
        res.render('shop-details', { products: product, session: req.session.user_id })

    } catch (err) {
        console.log(err.message);
    }
}

const loadProifle = async (req, res) => {
    try {

        const orders = await Order.find({ user: req.session.user_id }).populate('products.productId');
  
        const address = await Address.findOne({ user: req.session.user_id })
        const users = await User.findOne({ _id: req.session.user_id })

        res.render('user-profile', { user: users, addresses: address, session: req.session.user_id  , order : orders })

    } catch (err) {
        console.log(err.message);
    }
}

const updateProfile = async (req, res) => {
    try {

        const id = req.session.user_id
        await User.findByIdAndUpdate({ _id: id }, { $set: { name: req.body.name, phone: req.body.phone } })

        res.redirect('/profile')

    } catch (err) {
        next(err.message)
    }
}

const loadChangePass = async (req, res, next) => {
    try {

        const user = await User.findById({ _id: req.query.id })
        res.render('cpassword', { user: user, session: req.session.user_id })

    } catch (err) {
        next(err.message)
    }
}

const changePass = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: req.body.id });
        const mpassword = await bcrypt.compare(req.body.opass, user.password);

        if (mpassword) {
            if (req.body.npass === req.body.cpass) {
                if (req.body.opass !== req.body.npass) {
                    const spassword = await securepassword(req.body.npass);

                    await User.findOneAndUpdate({ _id: req.body.id }, { $set: { password: spassword } });

                    res.redirect('/profile');
                } else {
                    res.render('cpassword', { user: user, message: "new password cannot be the same as the old password" });
                }
            } else {
                res.render('cpassword', { user: user, message: "new password and confirm password don't match" });
            }
        } else {
            res.render('cpassword', { user: user, message: "incorrect old password" });
        }
    } catch (err) {
        next(err.message);
    }
};

const loadCheckOut = async (req, res, next) => {
    try {

        const cartData = await Cart.findOne({ user: req.session.user_id }).populate('products.productId')
        const address = await Address.findOne({ user: req.session.user_id })

        let total = 0

        if (cartData) {

            cartData.products.forEach((product) => {
                total = total + product.price * product.quantity
            })

            res.render('checkout', { session: req.session.user_id, addresses: address, cart: cartData , total : total })

        }

    } catch (err) {
        next(err.message)
    }
}

const loadOrderPlaced = async (req , res , next) => {
    try {

        const id = req.params.id
        const order = await Order.findOne({ _id : id }).populate('products.productId')

        res.render('order-placed' , { session : req.session.user_id , order : order })
        
    } catch (err) {
        next(err.message)
    }
}


const loadOrderDetails = async (req , res , next) => {
    try {

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric' , month: 'short' , day: '2-digit' }).replace(/\//g,'-')

        const orderId = req.params.id
        const orderData = await Order.findOne({ 'products._id' : orderId }).populate('products.productId')
        console.log(orderData);
        res.render('view-order-details' , { session : req.session.user_id , order : orderData } )
        
    } catch (err) {
        next(err.message)
    }
}

const loadWishlist = async (req , res , next) => {
    try {

        const wishlist = await Wishlist.findOne({ user : req.session.user_id }).populate('products.productId')
        res.render('wishlist' , { session : req.session.user_id , wish : wishlist })
        
    } catch (err) {
        next(err.message)
    }
}


const logout = async (req, res, next) => {
    try {

        req.session.destroy()
        res.redirect('/')

    } catch (err) {
        next(err.message)
    }
}



module.exports = {
    loadHome,
    loadShop,
    loadLogin,
    loadRegister,
    registerUser,
    loadOtp,
    verifyOtp,
    verifyLogin,
    resend,
    loadShopDetails,
    loadProifle,
    updateProfile,
    loadChangePass,
    changePass,
    logout,
    loadCheckOut,
    loadOrderPlaced,
    loadOrderDetails,
    loadWishlist
}