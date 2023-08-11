const User = require('../models/userModel')
const Category = require('../models/categoryModel')
const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const Wishlist = require('../models/wishlistModel')
const Coupon = require('../models/couponModel')
const Banner = require('../models/bannerModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const fs = require('fs')
const ejs = require('ejs')
const puppeteer = require('puppeteer')
const path = require('path')
const { wallet } = require('./checkoutController')


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
            service: 'gmail',
            auth: {
                user: process.env.MAIL,
                pass: process.env.PASS
            },
        })

        const mailOptions = {
            from: process.env.MAIL,
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

        const banners = await Banner.find({})
        const product = await Product.find({ is_delete: 0 })
      
        res.render('home', { products: product, session: req.session.user_id, banners })

    } catch (err) {
        console.log(err.message);
    }
}

const loadShop = async (req, res) => {
    try {

        const sort = req.query.sort || 'none'
        const filter = req.query.filter || 'All';
        const search = req.query.search || null;
        const page = parseInt(req.query.page) || 1;
        const limit = 6;

        const category = await Category.find({ is_delete: false });
        const searchQuery = search ? { name: { $regex: new RegExp(search, 'i') } } : {};

        const query = {
            is_delete: 0,
            ...searchQuery
        };


        if (filter && filter !== 'All') {
            query.category = filter;
        }

        let sortOptions = {};

        if (sort === 'Low To High') {
            sortOptions = { price: 1 };
        } else if (sort === 'High To Low') {
            sortOptions = { price: -1 };
        }

        const product = await Product.find(query)
            .limit(limit)
            .skip((page - 1) * limit)
            .sort(sortOptions)
            .exec();

        const count = await Product.countDocuments(query);

        res.render('shop', {
            categories: category,
            products: product,
            session: req.session.user_id,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            filter,
            search,
            sort
        });
    } catch (err) {
        console.log(err.message);
    }
};


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
        const product = await Product.find({ _id: id }).populate('review.user')
        res.render('shop-details', { products: product, session: req.session.user_id })

    } catch (err) {
        console.log(err.message);
    }
}

const loadProifle = async (req, res) => {
    try {

        const orders = await Order.find({ user: req.session.user_id, status: 'placed' }).populate('products.productId').sort({ date: -1 })
        const address = await Address.findOne({ user: req.session.user_id })
        const users = await User.findOne({ _id: req.session.user_id })
        const walletHistory = await Order.find({ user : req.session.user_id , payment : 'wallet' , status : 'placed' }).sort({ date: -1 })

        res.render('user-profile', { user: users, addresses: address, session: req.session.user_id, order: orders , walletHistory })

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
            res.render('cpassword', { user: user, message: "incorrect old password" , session : req.session.user_id });
        }
    } catch (err) {
        next(err.message);
    }
};

const loadCheckOut = async (req, res, next) => {
    try {
        const code = req.query.coupon;
        const couponData = await Coupon.findOne({ code: code });
        const coupons = await Coupon.find({ user: { $nin: [req.session.user_id] }});
        const cartData = await Cart.findOne({ user: req.session.user_id }).populate('products.productId');
        const address = await Address.findOne({ user: req.session.user_id });
        const user = await User.findOne({ _id: req.session.user_id })
        const wallet = user.wallet

        let total = 0;
        let grandTotal = 0;

        if (cartData) {
            cartData.products.forEach((product) => {
                total = total + product.price * product.quantity;
                grandTotal = grandTotal + product.price * product.quantity;
            });

            if (couponData) {
                const exUser = couponData.user.find((user) => user.toString() == req.session.user_id);
                if (exUser) {
                    return res.redirect('/checkout')
                } else {
                    if (new Date() <= couponData.expireDate) {
                        if (total >= couponData.minimum) {
                            const percentage = (couponData.discountPercentage / 100)
                            console.log(percentage);
                            const discountedProducts = cartData.products.map((product) => ({
                                ...product.toObject(),
                                totalPrice: Math.floor(product.price * product.quantity - product.price * product.quantity * percentage)
                            }));

                            let minus = Math.floor((couponData.discountPercentage / 100) * total)
                            total = Math.floor(grandTotal - minus)

                            return res.render('checkout', {
                                session: req.session.user_id,
                                addresses: address,
                                cart: { ...cartData.toObject(), products: discountedProducts }, // Override the original products with the discounted products
                                total: total,
                                grandTotal,
                                couponData,
                                coupons,
                                coupon: req.query.coupon,
                                wallet
                            });
                        } else {
                            return res.redirect('/checkout')
                        }
                    } else {
                        return res.redirect('/checkout')
                    }
                }
            }

            return res.render('checkout', {
                session: req.session.user_id,
                addresses: address,
                cart: cartData,
                total: total,
                grandTotal,
                couponData,
                coupons,
                coupon: req.query.coupon,
                wallet
            })
        } else {
            return res.redirect('/checkout')
        }

    } catch (err) {
        next(err.message);
    }
}


const loadOrderPlaced = async (req, res, next) => {
    try {

        const id = req.params.id
        const order = await Order.findOne({ _id: id }).populate('products.productId')

        res.render('order-placed', { session: req.session.user_id, order: order })

    } catch (err) {
        next(err.message)
    }
}


const loadOrderDetails = async (req, res, next) => {
    try {

        const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).replace(/\//g, '-')

        const orderId = req.params.id
        const orderData = await Order.findOne({ _id: orderId }).populate('products.productId')
        res.render('view-order-details', { session: req.session.user_id, order: orderData })

    } catch (err) {
        next(err.message)
    }
}

const loadWishlist = async (req, res, next) => {
    try {

        const wishlist = await Wishlist.findOne({ user: req.session.user_id }).populate('products.productId')
        res.render('wishlist', { session: req.session.user_id, wish: wishlist })

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

const review = async (req, res, next) => {
    try {

        const id = req.body.id
        console.log(id);
        const { review } = req.body
        const newReview = {
            user: req.session.user_id,
            review: review,
        };
        await Product.findOneAndUpdate({ _id: id }, { $push: { review: newReview } })

        res.redirect(`/shop-details?id=${id}`)

    } catch (err) {
        next(err.message)
    }
}

const deleteReview = async (req , res , next) => {
    try {

        const id = req.body.reviewId
        console.log(id);
        const proId = req.body.productId
        console.log(proId);
        const updated = await Product.findOneAndUpdate({ _id : proId } , { $pull : { review : { _id : id }}})
        if(updated) {
            res.json({ success : true , query : proId })
        }
        
    } catch (err) {
        next(err.message)
    }
}

const loadInvoice = async (req, res) => {
    try {
        const id = req.params.id;
        const userData = await User.findOne({ _id: req.session.user_id })
        const orderData = await Order.findOne({ _id: id }).populate('products.productId');
        const date = new Date()


        data = {
            order: orderData,
            user: userData,
            date,
        }

        const filepathName = path.resolve(__dirname, '../views/user/invoice.ejs');
        const html = fs.readFileSync(filepathName).toString();
        const ejsData = ejs.render(html, data);

        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setContent(ejsData, { waitUntil: 'networkidle0' });
        const pdfBytes = await page.pdf({ format: 'Letter' });
        await browser.close();


        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename= order invoice.pdf');
        res.send(pdfBytes);

    } catch (err) {
        console.log(err);
        res.status(500).send('An error occurred');
    }
};



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
    loadWishlist,
    review,
    loadInvoice,
    deleteReview
}