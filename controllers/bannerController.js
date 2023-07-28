const Banner = require('../models/bannerModel')

const loadBanner = async (req , res , next) => {
    try {

        const banners = await Banner.find({})
        res.render('banner' , {banners})
        
    } catch (err) {
        console.log(err.message);
    }
}

const loadAddBanner = async (req , res , next) => {
    try {

        res.render('addBanner')
        
    } catch (err) {
        next(err.message)
    }
}

const addBanner = async (req , res , next) => {
    try {

       const { info , title , description } = req.body
       const image = req.file.filename
       console.log(image)
       const banner = new Banner({
            image : image,
            info : info,
            description : description,
            title : title
       })

       await banner.save()

       res.redirect('/admin/banner')
        
    } catch (err) {
        next(err.message)
    }
}

const loadEditBanner = async (req , res , next) => {
    try {

        res.render('addBanner')
        
    } catch (err) {
        next(err.message)
    }
}

const editBanner = async (req , res , next) => {
    try {

        res.render('addBanner')
        
    } catch (err) {
        next(err.message)
    }
}

module.exports = {
    loadBanner,
    loadAddBanner,
    addBanner,
    loadEditBanner,
    editBanner
}