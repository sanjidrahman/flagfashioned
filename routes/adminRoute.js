const express = require('express')
const admin_route = express()
const adminController = require('../controllers/adminController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const auth = require('../middleware/adminAuth')
const upload = require('../middleware/multer')
const nocache = require('nocache')


admin_route.set('view engine' , 'ejs')
admin_route.set('views' , './views/admin')

admin_route.use(nocache())

admin_route.get('/' , auth.isLogout ,  adminController.loadLogin)
admin_route.post('/login' , adminController.verifyLogin)
admin_route.get('/logout' , adminController.logOut)
admin_route.get('/dashboard' , auth.isLogin , adminController.loadDashboard)
admin_route.get('/user' , auth.isLogin , adminController.loadUser)
// admin_route.get('/delete-user' , auth.isLogin , adminController.deleteUser)
admin_route.get('/block-user' , auth.isLogin , adminController.blockUser)
admin_route.get('/unblock-user' , auth.isLogin , adminController.unblockUser) 


admin_route.get('/category' , auth.isLogin , categoryController.loadCategory)
admin_route.get('/add-category' , auth.isLogin , categoryController.loadAddCategory)
admin_route.post('/add-category' , categoryController.addCategory)
admin_route.get('/delete-category' , auth.isLogin , categoryController.deleteCategory)
admin_route.get('/edit-category' , auth.isLogin , categoryController.loadEditCategory)
admin_route.post('/edit-category' , categoryController.editCategory)


admin_route.get('/product' , auth.isLogin , productController.loadProduct)
admin_route.get('/add-product' , auth.isLogin , productController.loadAddProduct)
admin_route.post('/add-product' , upload.upload.array('image' , 5) , productController.addProduct)
admin_route.get('/delete-product' , auth.isLogin , productController.deleteProduct)
admin_route.get('/edit-product' , auth.isLogin , upload.upload.array('image' , 5) , productController.loadEditProduct)
admin_route.post('/edit-product' , upload.upload.array('image' , 5) , productController.editProduct)
admin_route.get('/delete-image/:id/:image' , auth.isLogin , productController.deleteImage)



module.exports = admin_route