const express = require('express')
const app = express()

const port = process.env.PORT || 5000
require('dotenv').config()

//Default Route
app.get('/', (req,res)=> {
    res.send('Innova Server is Running....')
})

//Add a Listener to the app
app.listen(port, ()=> {
    console.log('Server Running on Port:', port);
})