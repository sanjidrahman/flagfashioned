const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    addresses : [{

        fname: {
            type: String,
            required: true
        },
    
        lname: {
            type: String,
            required: true
        },
    
        phone: {
            type: Number,
            required: true
        },
    
        address: {
            type: String,
            required: true
        },
    
        city: {
            type: String,
            required: true
        },
    
        pin: {
            type: Number,
            required: true
        }

    }]

})

module.exports = mongoose.model('address', addressSchema)