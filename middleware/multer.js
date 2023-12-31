const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination : function (req , file , cb) {
        cb(null , path.join(__dirname , '../public/adminassets/productImages') , function (err , success) {
            if(err) {
                throw err
            }
        });
    },

    filename : function (req , file , cb) {
        const name = Date.now() + '-' + file.originalname
        cb(null , name , function (err , success) {
            if(err) {
                throw err
            }
        });
    }
});

const imageFilter = function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      req.fileValidationerror = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }

const upload = multer({ storage : storage , fileFilter : imageFilter})

module.exports = {
    upload
}