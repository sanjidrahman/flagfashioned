const Address = require('../models/addressModel')

const loadAddAddress = async (req, res, next) => {
    try {

        res.render('add-address' , { session : req.session.user_id })

    } catch (err) {
        next(err.message);
    }
}

const addAddress = async (req, res, next) => {
    try {

        const userId = req.session.user_id;

        const address = await Address.findOne({ user: userId });

        if (address) {
            await Address.updateOne(
                { user: userId },
                {
                    $push: {
                        addresses: {
                            fname: req.body.name,
                            lname: req.body.lname,
                            phone: req.body.phone,
                            address: req.body.address,
                            city: req.body.city,
                            pin: req.body.pin
                        }
                    }
                }
            );
        } else {
            const newAddress = new Address({
                user: userId,
                addresses: [{
                    fname: req.body.name,
                    lname: req.body.lname,
                    phone: req.body.phone,
                    address: req.body.address,
                    city: req.body.city,
                    pin: req.body.pin
                }]
            });
            await newAddress.save();
        }

        res.redirect('/profile');
    } catch (err) {
        next(err);
    }
}

const loadEditAddress = async (req, res, next) => {
    try {

        const id = req.session.user_id
        const address_id = req.query.addressId

        const addressdata = await Address.findOne({ user: id }, { addresses: { $elemMatch: { _id: address_id } } });
        res.render('edit-address', { address: addressdata.addresses[0] , session : req.session.user_id })

    } catch (err) {
        next(err.message)
    }
}

const editAddress = async (req, res, next) => {
    try {

        const id = req.session.user_id
        const address_id = req.body.addressId

        const data = await Address.findOneAndUpdate(
            { user: id, "addresses._id": address_id },
            {
                $set: {
                    "addresses.$.fname": req.body.fname,
                    "addresses.$.lname": req.body.lname,
                    "addresses.$.phone": req.body.phone,
                    "addresses.$.address": req.body.address,
                    "addresses.$.city": req.body.city,
                    "addresses.$.pin": req.body.pin,
                },
            }
        );
        res.redirect('/profile')
    } catch (err) {
        next(err.message)
    }
}

const deleteAddress = async (req, res, next) => {
    try {
        const addressId = req.body.addressId;
        const userId = req.session.user_id;
        const address = await Address.findOne({ user : userId })

        if(address.addresses.length === 1 ) {

            const daddress = await Address.deleteOne({ user : userId})

            res.json({ success : true })

        } else {

            const daddress = await Address.findOneAndUpdate(
                { user: userId, 'addresses._id': addressId },
                { $pull: { addresses : { _id : addressId } } }
            );
            if(daddress) {
                res.json({ success: true });
            }else{
                res.json({ success : false })
            }  

        }

    } catch (err) {
        next(err);
    }
}

module.exports = {
    loadAddAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress
}