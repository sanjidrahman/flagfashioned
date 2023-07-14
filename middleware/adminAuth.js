const isLogin = async (req , res , next) => {
    try {

        if(req.session.user_id) {
            next()
        }else{
            res.redirect('/admin')
        }

    } catch (err) {
        console.log(err.message);
    }
}

const isLogout = async (req , res , next) => {
    try {
        if(req.session.user_id) {
            res.redirect('/admin/dashboard')
        }else{
            next()
        }
    } catch (err) {
        console.log(err.message);
    }
}

module.exports = {
    isLogin,
    isLogout
}