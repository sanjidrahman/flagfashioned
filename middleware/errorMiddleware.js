const errorMiddleware = (err , req , res , next) => {
    console.log(err.message);
}

module.exports = errorMiddleware