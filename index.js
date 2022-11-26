const express = require('express')
const app = express()

const port = process.env.PORT || 5000
require('dotenv').config()

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const dbConnect = () => {
    const categories = client.db('innova').collection('categories')
    const productsCollection = client.db('innova').collection('products')
    const users = client.db('innova').collection('users')
    const bookedProducts = client.db('innova').collection('bookedproducts')

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
        const result = await productsCollection.insertOne(newProduct)
        res.send(result)
    })

    //Get Products for a specific category
    app.get('/products/:category', async(req, res)=> {
        const category = req.params.category;
        const query = {
            productCategory: category
        }
        const products = await productsCollection.find(query).toArray()
        res.send(products)
    })
    //Get Products added by a user
    app.get('/products', async(req, res)=> {
        const email = req.query.email;
        const query = {
            sellerEmail: email
        }
        const result = await productsCollection.find(query).toArray()
        res.send(result)
    })
    //Update a product status and Boost/Promote a Product
    app.put('/products/:id', async(req, res)=>{
        const id = req.params.id;
        const update = req.body;
        const filter = {_id: ObjectId(id)}
        const options = {upsert: true};
        const updatedProduct = {
            $set: update
        }
        const result = await productsCollection.updateOne(filter, updatedProduct, options)
        res.send(result)
    })
    //Delete a Specific product from listing
    app.delete('/products/:id', async(req, res)=> {
        const id = req.params.id;
        const query = {_id: ObjectId(id)}
        const result = await productsCollection.deleteOne(query);
        res.send(result)
    })
    //Book a Product
    app.post('/products/book', async(req, res)=> {
        const product = req.body
        const result = await bookedProducts.insertOne(product)
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