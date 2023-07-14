const Category = require('../models/categoryModel')

const loadCategory = async (req , res) => {
    try {

        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        const limit = 7

        const categoryList = await Category.find({
            is_delete : false
        })
        .limit(limit * 1)
        .skip((page-1)*limit)
        .exec()

        const count = await Category.find({
            is_delete : false
        }).countDocuments()

        res.render('category' , { 
            categories : categoryList,
            totalPages : Math.ceil(count/limit),
         })
        
    } catch (err) {
        console.log(err.message);
    }
}

const loadAddCategory = async (req , res) => {
    try {

        res.render('addCategory')
        
    } catch (err) {
        console.log(err.message);
    }
}

const addCategory = async (req , res) => {
    try {

        existCat = req.body.categoryName
        const existingCategory = await Category.findOne({ name : existCat })

        if(existingCategory) {
            res.render('addCategory' , {message : 'category already exists'})
        }else{
            const category = new Category ({
                name : req.body.categoryName
            })

            const newCategory = await category.save()

            if(newCategory) {
                res.redirect('/admin/category')
            }
        }
        
    } catch (err) {
        console.log(err.message);
    }
}

const deleteCategory = async (req , res) => {
    try {
        
        const id = req.query.id
        await Category.deleteOne({ _id : id })
        res.redirect('/admin/category')

    } catch (err) {
        console.log(err.message);
    }
}

const loadEditCategory = async (req , res) => {
    try {

       const id = req.query.id
       const editCat = await Category.findById({ _id : id})

       if(editCat) {
        res.render('editCategory' , {category : editCat})
       }else{
        res.redirect('/admin/category')
       }
        
    } catch (err) {
        console.log(err.message);
    }
}

const editCategory = async (req , res) => {
    try {

        const catName = req.body.categoryName
        const catId = req.body.id

        const updateCategory = await Category.findOneAndUpdate({ _id : catId } , {$set : {name : catName}})

        if(updateCategory) {
            res.redirect('/admin/category')
        }else{
            res.render('editCategory' , { message : 'something went wrong !!'})
        }
        
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = {
    loadCategory,
    loadAddCategory,
    addCategory,
    deleteCategory,
    loadEditCategory,
    editCategory
}