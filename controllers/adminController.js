const User = require('../models/userModel')
const bcrypt = require('bcrypt')
const Order = require('../models/orderModel')           


const loadDashboard = async (req , res) => {
    try {

        const users = await User.find({ is_admin: 0 }).sort({ _id: -1 }).limit(5);
        const totalAmount = await Order.aggregate([
            { $unwind: '$products' },
            { $match: { 'products.status' : 'delivered' }},
            { $group: { _id: null, total: { $sum: '$products.totalPrice' } } },
            { $project: { total: 1, _id: 0 } },
          ]);
        const totalOrders = await Order.find({ }).countDocuments()  
        const totalSold = await Order.aggregate([
            { $unwind: '$products' },
            { $match: { 'products.status' : 'delivered' }},
            { $group: { _id: null, total: { $sum: '$products.quantity' } } },
            { $project: { total: 1, _id: 0 } },
          ]);
        const totalPending = await Order.find({status : 'pending'}).countDocuments()
        const paymentCod = await Order.aggregate([
            { $match : { payment : 'cod' , 'products.status' : 'delivered' }},
            { $group : { _id : null , total : {$sum : '$totalAmount' }}},
            { $project : { total : 1 , _id : 0 }}
        ]);
        const paymentRazor = await Order.aggregate([
            { $match : { payment : 'razor' , 'products.status' : 'delivered' }},
            { $group : { _id : null , total : {$sum : '$totalAmount' }}},
            { $project : { total : 1 , _id : 0 }}
        ]);
        const expected = await Order.aggregate([
            { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }}},
            { $project: { _id: 0, totalAmount: 1 }},
          ]);
          console.log(expected);

        res.render('dashboard' , {
            users,
            totalAmount,
            totalOrders,
            totalSold,
            totalPending,
            paymentCod,
            paymentRazor,
            expected
        })
        
    } catch (err) {
        console.log(err.message);
    }
}

const loadUser = async (req , res) => {
    try {

        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        const limit = 7

        const userData = await User.find({ 
            is_admin : 0 
        })
        .limit(limit * 1)
        .skip((page-1) * limit)
        .exec()

        const count = await User.find({ 
            is_admin : 0 
        }).countDocuments()
    

        res.render('user' , {users : userData ,
            totalPages : Math.ceil( count / limit ),
            currentPage : page
        })
        
    } catch (err) {
        console.log(err.message);
    }
}

const loadLogin = async (req , res) => {
    try {

        res.render('login')
        
    } catch (err) {
        console.log(err.message);
    }
}

const verifyLogin = async(req , res) => {
    try {

        const email = req.body.email
        const password = req.body.password

        const userData = await User.findOne({email : email})

        if(userData) {
            const mpassword = await bcrypt.compare(password , userData.password)

            if(mpassword) {
                if(userData.is_admin === 1) {
                    req.session.user_id = userData._id
                    res.redirect('/admin/dashboard')
                }else{
                    res.render('login' , {message : 'email or password incorrect'})
                }
            }else{
                res.render('login' , {message : 'email or password incorrrect'})
            }
        }else{
            res.render('login' , {message : 'email or password incorrect'})
        }
        
    } catch (err) {
        console.log(err.message);
    }
}

// const deleteUser = async (req , res) => {
//     try {

//         const id = req.query.id
//         await User.deleteOne({ _id : id})
//         res.redirect('/admin/user')
        
//     } catch (err) {
//         console.log(err.message);
//     }
// }

const blockUser = async (req , res) => {
    try {

        const id = req.query.id
        await User.findOneAndUpdate({ _id : id} , {$set : { is_blocked : 1 }})
        res.redirect('/admin/user')
        
    } catch (err) {
        console.log(err.message);
    }
}

const unblockUser = async (req , res) => {
    try {

        const id = req.query.id
        await User.findOneAndUpdate({ _id : id } , {$set : { is_blocked : 0}})
        res.redirect('/admin/user')

    } catch (err) {
        console.log(err.message);
    }
}

const logOut = async (req , res) => {
    try {

        req.session.destroy()
        res.redirect('/admin/login')
        
    } catch (err) {
        console.log(err.message);
    }
}


module.exports = {
    loadDashboard,
    loadUser,
    loadLogin,
    verifyLogin,
    blockUser,
    unblockUser,
    logOut
}