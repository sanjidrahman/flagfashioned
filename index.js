const dotenv = require('dotenv')
dotenv.config()
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGODB)
.then(()=> console.log('connected'))
.catch((err)=> console.log(err.message))
const session = require('express-session')
const config = require('./config/config')
const morgan = require('morgan')
const nocache = require('nocache')
const errorMiddleware = require('./middleware/errorMiddleware')


const express = require('express');
const app = express()

app.use(errorMiddleware)

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(session({
    secret : config.sessionSecret,
    resave : false,
    saveUninitialized : true
}))
app.use(express.static('public'));
app.use(nocache())
app.use(morgan('dev'))


const userRoute = require('./routes/userRoute')
app.use('/', userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)


app.listen( process.env.PORT , () => {
    console.log('server running');
})