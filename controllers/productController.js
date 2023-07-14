const Product = require('../models/productModel')
const Category = require('../models/categoryModel')
const fs = require('fs')
const path = require('path')

const loadProduct = async (req, res) => {
    try {

        var page = 1 
        if(req.query.page) {
            page = req.query.page
        }

        const limit = 7

        const product = await Product.find({
            is_delete : 0
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)

        const count = await Product.find({
            is_delete : 0
        }).countDocuments()

        res.render('product', { 
            products: product,
            totalPages : Math.ceil(count / limit)
         })

    } catch (err) {
        console.log(err.message);
    }
}

const loadAddProduct = async (req, res) => {
    try {

        const category = await Category.find({ is_delete: false })
        res.render('addProduct', { categories: category })

    } catch (err) {
        console.log(err.message);
    }
}

const addProduct = async (req, res) => {
    try {


        var images = []
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename)
            }
        }


        const category = await Category.find({ is_delete: false })
        const existProduct = await Product.findOne({ name: req.body.name })
        if (existProduct) {
            res.render('addProduct', { message: 'product exists', categories: category })
        } else {

            const product = new Product({
                name: req.body.name,
                price: req.body.price,
                description: req.body.description,
                image: images,
                category: req.body.category,
                stock : req.body.stock
            })

            const newProduct = product.save()

            if (newProduct) {
                res.redirect('/admin/product')
            } else {
                res.render('addProduct', { message: 'something went wrong' })
            }
        }

    } catch (err) {
        console.log(err.message);
    }
}

const deleteProduct = async (req, res) => {
    try {

        await Product.findOneAndUpdate({ _id: req.query.id } , {$set : { is_delete : 1 }})
        res.redirect('/admin/product')

    } catch (err) {
        console.log(err.message);
    }
}

const loadEditProduct = async (req, res) => {
    try {

        const category = await Category.find({ is_delete: false })
        const editProduct = await Product.findById({ _id: req.query.id })
        res.render('editProduct', { product: editProduct, categories: category })

    } catch (err) {
        console.log(err.messsage);
    }
}

const editProduct = async (req, res) => {
    try {


        var images = []
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                images.push(req.files[i].filename)
            }
        }

        
        const imageUpdate = await Product.findByIdAndUpdate({ _id : req.body.id } , {$push : {image : {$each : images}}})
        if(imageUpdate) {
            res.redirect(`/admin/edit-product?id=${req.body.id}`)
        }

        const id = req.body.id
        const newName = req.body.name
        const newPrice = req.body.price
        const newDescri = req.body.description
        const newCat = req.body.category
        const newStock = req.body.stock
        const editedProduct = await Product.findOneAndUpdate({ _id: id }, {
            $set: {
                name: newName,
                price: newPrice,
                description: newDescri,
                category: newCat,
                stock: newStock
            }
        })

        // if (editedProduct) {
        //     res.redirect('/admin/product')
        // } else {
        //     res.render('editProduct', { message: 'something went wrong !!' })
        // }

    } catch (err) {
        console.log(err.message);
    }
}

const deleteImage = async (req , res) => {
    try {

        const id = req.params.id
        const image = req.params.image
        console.log(id);
        console.log(image);

        fs.unlink(path.join(__dirname , '../public/adminassets/productImages' , image) , () => {})
        const deleImg = await Product.updateOne({ _id : id } , {$pull : {image : image}})

        if(deleImg) {
            res.redirect(`/admin/edit-product?id=${id}`)
        }
        
    } catch (err) {
        console.log(err.message);
    }
}


module.exports = {
    loadProduct,
    loadAddProduct,
    addProduct,
    deleteProduct,
    loadEditProduct,
    editProduct,
    deleteImage
}