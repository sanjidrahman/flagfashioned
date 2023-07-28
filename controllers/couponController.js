const Coupon = require('../models/couponModel')

const loadCoupon = async (req , res , next) => {
    try {

        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        const limit = 5

        const coupons = await Coupon.find({})
        .limit(limit * 1)
        .skip((page-1)*limit)

        const count = await Coupon.find({}).countDocuments()

        res.render('couponList' , { 
            coupons ,
            totalPages : Math.ceil(count / limit)
        })
        
    } catch (err) {
        next(err.message)
    }
}

const loadAddCoupon = async (req , res , next) => {
    try {

        res.render('addCoupon')
        
    } catch (err) {
        next(err.message)
    }
}

const addCoupon = async (req , res , next) => {
    try {

        const code = req.body.code
        const already = await Coupon.findOne({ code : code })

        if(already){
            res.render('addCoupon' , {message : 'code already exists'})
        }else{
            const newCoupon = new Coupon({
                code : req.body.code,
                discountPercentage : req.body.discountPercentage,
                startDate : req.body.startDate,
                expireDate : req.body.expiryDate,
                minimum : req.body.minimum
            })

            await newCoupon.save()
            res.redirect('/admin/coupon')

        }
        
    } catch (err) {
        next(err.message)
    }
}

const loadEditCoupon = async (req , res , next) => {
    try {

        const id = req.query.id
        console.log(id);
        const coupons = await Coupon.findOne({ _id : id })
        console.log(coupons.startDate);
        res.render('editCoupon' , { coupons })
        
    } catch (err) {
        next(err.message)
    }
}

const editCoupon = async (req , res , next) => {
    try {

        const id = req.body.id
        await Coupon.findOneAndUpdate({ _id : id } , 
            { $set : {
                code : req.body.code,
                discountPercentage : req.body.discountPercentage,
                startDate : req.body.startDate,
                expireDate : req.body.expiryDate,
                minimum : req.body.minimum
            }})
        
            res.redirect('/admin/coupon')
        
    } catch (err) {
        next(err.message)
    }
}

const deleteCoupon = async (req , res , next) => {
    try {

        const id = req.query.id
        await Coupon.findOneAndDelete({_id : id})
        
        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        const limit = 5
        const coupons = await Coupon.find({})
        .limit(limit * 1)
        .skip((page-1)*limit)

        const count = await Coupon.find({}).countDocuments()

        res.render('couponList' , { 
            coupons ,
            totalPages : Math.ceil(count / limit)
        })
        
    } catch (err) {
        next(err.message)
    }
}

// -----------USER SIDE----------

// const coupon = async (req , res , next) => {
//     try {

//         const coupon = req.body.coupon
//         console.log(coupon);
//         const total = req.body.total

//         const couponData = await Coupon.findOne({ code : coupon })

//         if(couponData) {
//            const userExist = couponData.user.find((u) => u._id.toString() == req.session.user_id)
//            if(userExist) {
//             res.json({ sucess : false , message : 'user have used' })
//            }else{

//             const discountTotal = (couponData.discountPercentage/100)*total
//             console.log(discountTotal);

//             res.json({ success : true })

//            }
//         }
        
        
//     } catch (err) {
//         next(err.message);
//     }
// }
 

module.exports = {
    loadCoupon,
    loadAddCoupon,
    addCoupon,
    loadEditCoupon,
    editCoupon,
    deleteCoupon,
    // coupon
}