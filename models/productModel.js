const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true
    },

    price : {
        type : Number,
        required : true
    },

    description : {
        type : String,
        required : true
    },

    image : {
        type : Array,
        required : true
    },

    category : {
        type : String,
        required : true
    },

    stock : {
        type : Number,
        rerquired : true
    },

    is_delete : {
        type : Number,
        default : 0
    }
})

module.exports = mongoose.model('product' , productSchema)