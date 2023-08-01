const Product = require('../models/productModel')
const Address = require('../models/addressModel')
const Cart = require('../models/cartModel')
const Order = require('../models/orderModel')
const User = require('../models/userModel')


const cancelOrder = async (req, res, next) => {
    try {

        const id = req.body.crId
        const reason = req.body.reason
        const orderId = req.body.id

        const orderData = await Order.findOne({ 'products._id' : id })
        const order = orderData.products
        const cancelPro = orderData.products.find((pro) => pro._id.toString() === id)
        const refund = cancelPro.totalPrice
        console.log(refund);

        for(let i=0 ; i < order.length ; i++) {
          const productId = order[i].productId
          const quantity = order[i].quantity
          await Product.findByIdAndUpdate({ _id : productId } , { $inc : { stock : quantity }})
        }
        await User.findOneAndUpdate({ _id : req.session.user_id } , { $inc : { wallet : refund }})
        const cancel = await Order.findOneAndUpdate({ _id: orderId, 'products._id': id }, {
            $set: {
                'products.$.status': 'cancelled',
                'products.$.cancelReason': reason
            }
        })

        if (cancel) {
            res.json({ success: true  })
        } else {
            res.json({ success: false })
        }

    } catch (err) {
        next(err.message)
    }
}

const returnOrder = async (req, res, next) => {
    try {

        const reason = req.body.reason
        const id = req.body.crId
        const orderId = req.body.id
        console.log(req.body);

        const orderData = await Order.findOne({ 'products._id' : id })
        const order = orderData.products
        console.log(order);

        for(let i=0 ; i < order.length ; i++) {
          const productId = order[i].productId
          const quantity = order[i].quantity
          console.log(quantity);
          await Product.findByIdAndUpdate({ _id : productId } , { $inc : { stock : quantity }})
        }
        await User.findOneAndUpdate({ _id : req.session.user_id } , { $inc : { wallet : refund }})
        const cancel = await Order.findOneAndUpdate({ _id : orderId , 'products._id': id }, {
            $set: {
                'products.$.status': 'returned',
                'products.$.returnReason': reason
            }
        })

        if (cancel) {
            res.json({ success: true })
        } else {
            res.json({ success: false })
        }

    } catch (err) {
        next(err.message)
    }
}


// ------------ ADMIN SIDE ------------

const loadOrder = async (req, res, next) => {
    try {

        var pages = 1
        if (req.query.pages) {
            pages = req.query.pages
        }

        const limit = 7

        const orders = await Order.find({})
            .limit(limit * 1)
            .skip((pages - 1) * limit)
            .sort({date : -1})

        const count = await Order.find({}).sort({ date: -1 })
        .countDocuments()

        res.render('orders', {
            orders,
            totalPages: Math.ceil(count / limit)
        })

    } catch (err) {
        next(err.message)
    }
}


const orderDetails = async (req, res, next) => {
    try {

        const orderId = req.query.id
        const order = await Order.findOne({ _id: orderId }).populate('products.productId')

        res.render('order-details', { order })

    } catch (err) {
        next(err.message)
    }
}

const update = async (req, res, next) => {
    try {

        const productId = req.body.pid
        const orderId = req.body.oid
        const status = req.body.status

        const orderData = await Order.findOneAndUpdate({ _id: orderId, 'products._id': productId },
            {
                $set:
                {
                    'products.$.status': status
                }
            })

        res.redirect(`/admin/order-detail?id=${orderId}`)

    } catch (err) {
        next(err.message)
    }
}

const salesReport = async (req, res, next) => {
    try {

        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        var limit = page == 1 ? 3 : 6

        const totalOrders = await Order.aggregate([
            { $unwind: '$products' },
            { $match: {'products.status': 'delivered'}},
            { $group: { _id: null, total: { $sum: 1 }}}
          ]);

        const totalAmount = await Order.aggregate([
            { $unwind: '$products' },
            { $match: {'products.status': 'delivered'}},
            { $group: { _id: null, total: { $sum: '$products.totalPrice' }}}
          ]);

        const totalSold = await Order.aggregate([
            { $unwind: '$products' },
            { $match: {'products.status': 'delivered'}},
            { $group: { _id: null, total: { $sum: '$products.quantity' }}},
            { $project : { total : 1 , _id : 0 }}
        ]);


        const product = await Order.aggregate([
            { $unwind: "$products" },
            { $match : { 'products.status' : 'delivered' }},
            { $group: { _id: "$products.productId",
              totalQuantitySold: { $sum: "$products.quantity" },
              totalRevenueGenerated: { $sum: "$products.totalPrice" }
            }},
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productData"}},
            { $unwind: "$productData" },
            { $project: { productName: "$productData.name",  productImage: { $arrayElemAt: ["$productData.image", 0] } , totalQuantitySold: 1, totalRevenueGenerated: 1 }}
          ])
          .limit(limit * 1)
          .skip((page -1) * limit)
          .exec()

          const result = await Order.aggregate([
            { $unwind: "$products" },
            { $match : { 'products.status' : 'delivered' }},
            { $group: { _id: "$products.productId",
              totalQuantitySold: { $sum: "$products.quantity" },
              totalRevenueGenerated: { $sum: "$products.totalPrice" }
            }},
            { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "productData"}},
            { $unwind: "$productData" },
            { $project: { productName: "$productData.name",  productImage: { $arrayElemAt: ["$productData.image", 0] } , totalQuantitySold: 1, totalRevenueGenerated: 1 }}
          ])

          const count = result.length

        res.render('sales-report' , { 
            totalOrders,
            totalAmount, 
            totalSold, 
            product,
            totalPages : Math.ceil( count / limit )
         })


    } catch (err) {
        next(err.message)
    }
}

const sortSalesReport = async (req, res, next) => {
    try {

        var page = 1
        if(req.query.page) {
            page = req.query.page
        }

        var limit = page == 1 ? 3 : 6
        
        
      let fromDate = req.body.fromDate ? new Date(req.body.fromDate) : null;
      fromDate.setHours(0, 0, 0, 0);
      let toDate = req.body.toDate ? new Date(req.body.toDate) : null;
      toDate.setHours(23, 59, 59, 999);

      const currentDate = new Date();

  
      if (fromDate && toDate) {
        if (toDate < fromDate) {
          const temp = fromDate;
          fromDate = toDate;
          toDate = temp;
        }
      } else if (fromDate) {
        toDate = currentDate;
      } else if (toDate) {
        fromDate = currentDate;
      }


      console.log(fromDate)
      console.log(toDate)
  
      var matchStage = {
        'products.status': 'delivered',
        createdAt : { $gte: fromDate, $lte: toDate },
      };
  
      const totalOrders = await Order.aggregate([
        { $unwind: '$products' },
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: 1 } } },
      ]);

      console.log(totalOrders);
  
      const totalAmount = await Order.aggregate([
        { $unwind: '$products' },
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$products.totalPrice' } } },
      ]);

      console.log(totalAmount);

      const totalSold = await Order.aggregate([
        { $unwind: '$products' },
        { $match: matchStage },
        { $group: { _id: null, total: { $sum: '$products.quantity' } } },
        { $project: { total: 1, _id: 0 } },
      ]);

      console.log(totalSold);

      const product = await Order.aggregate([
        { $unwind: '$products' },
        { $match: matchStage },
        { $group: {
            _id: '$products.productId',
            totalQuantitySold: { $sum: '$products.quantity' },
            totalRevenueGenerated: { $sum: '$products.totalPrice' },
          },
        },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productData' } },
        { $unwind: '$productData' },
        { $project: { productName: '$productData.name', productImage: { $arrayElemAt: ['$productData.image', 0] }, totalQuantitySold: 1, totalRevenueGenerated: 1 } },
      ]).limit(limit * 1).skip((page - 1) * limit).exec();

      console.log(product);

  
      const result = await Order.aggregate([
        { $unwind: '$products' },
        { $match: matchStage },
        { $group: {
            _id: '$products.productId',
            totalQuantitySold: { $sum: '$products.quantity' },
            totalRevenueGenerated: { $sum: '$products.totalPrice' },
          },
        },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productData' } },
        { $unwind: '$productData' },
        { $project: { productName: '$productData.name', productImage: { $arrayElemAt: ['$productData.image', 0] }, totalQuantitySold: 1, totalRevenueGenerated: 1 } },
      ]);
  
      const count = result.length;
  
      res.render('sales-report', { 
        totalOrders,
        totalAmount,
        totalSold,
        product,
        totalPages: Math.ceil(count / limit),
        fromDate,
        toDate,
      });
    } catch (err) {
      next(err.message);
    }
  };
  

module.exports = {
    cancelOrder,
    returnOrder,
    loadOrder,
    orderDetails,
    update,
    salesReport,
    sortSalesReport
}