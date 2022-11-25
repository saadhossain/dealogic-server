const express = require('express')
const app = express()

const port = process.env.PORT || 5000
require('dotenv').config()

const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors')

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const dbConnect = () => {
    const categories = client.db('innova').collection('categories')
    const products = client.db('innova').collection('products')
    const users = client.db('innova').collection('users')

    //Get the Category from the database
    app.get('/categories', async(req, res)=> {
        const query = {}
        const category = await categories.find(query).toArray()
        res.send(category)
    })

    //Save new user to the Database
    app.post('/users', async(req,res)=> {
        const user = req.body;
        const result = await users.insertOne(user)
        res.send(result)
    })

    //Save new Product from the database
    app.post('/products', async(req,res)=> {
        const newProduct = req.body;
        const result = await products.insertOne(newProduct)
        res.send(result)
    })
}

dbConnect()
//Default Route
app.get('/', (req,res)=> {
    res.send('Innova Server is Running....')
})

//Add a Listener to the app
app.listen(port, ()=> {
    console.log('Server Running on Port:', port);
})