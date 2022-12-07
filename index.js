const express = require('express')
const app = express()

const port = process.env.PORT || 5000
require('dotenv').config()
//Json web token
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
//Require Cors
const cors = require('cors')
const whitelist = ['http://localhost:3000']
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}
app.use(cors(corsOptions))

app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@firstmongodb.yjij5fj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET)
//Generate JWT Token for the user
app.post('/getToken', (req, res) => {
    const user = req.body
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
    res.send({ accesstoken: token })
})

//Verify Token Send by user while requesting for a data
const verifyToken = (req, res, next) => {
    const authToken = req.headers.authorization;
    if (!authToken) {
        return res.status(401).send({ message: 'You are not authorized to get this data' })
    }
    const token = authToken.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'You are not authorized to get this data' })
        }
        req.decoded = decoded
        next()
    })
}
const dbConnect = () => {
    const categories = client.db('dealogic').collection('categories')
    const productsCollection = client.db('dealogic').collection('products')
    const users = client.db('dealogic').collection('users')
    const blogs = client.db('dealogic').collection('blogs')

    //Get the Category from the database
    app.get('/categories', async (req, res) => {
        const query = {}
        const category = await categories.find(query).toArray()
        res.send(category)
    })
    //Save new Product from the database
    app.post('/products', async (req, res) => {
        const newProduct = req.body;
        const result = await productsCollection.insertOne(newProduct)
        res.send(result)
    })
    // //Get Products for a specific category
    app.get('/products/:category', async (req, res) => {
        const category = req.params.category;
        const query = {
            productCategory: category
        }
        const products = await productsCollection.find(query).toArray()
        res.send(products)
    })
    //Get all the Products from the database
    app.get('/products', async (req, res) => {
        const query = {}
        const products = await productsCollection.find(query).toArray()
        res.send(products)
    })
    //Get a Single Product
    app.get('/products/:id', async (req, res) => {
        const id = req.params.id;
        console.log(id);
        const query = { _id: ObjectId(id) }
        const product = await productsCollection.find(query).toArray()
        res.send(product)
    })
    //Get Products added by a user
    app.get('/seller/products', verifyToken, async (req, res) => {
        const email = req.query.email
        const decoded = req.decoded
        if (decoded.email !== email) {
            return res.status(403).send({ message: 'Data Forbidden for you' })
        }
        const query = {
            sellerEmail: email
        }
        const result = await productsCollection.find(query).toArray()
        res.send(result)
    })
    //Get Promoted/Boosted products
    app.get('/promoted', async (req, res) => {
        const query = {
            promoted: true,
            booked: false
        }
        const promotedProducts = await productsCollection.find(query).limit(8).toArray()
        res.send(promotedProducts)
    })
    //Update a product status and Boost/Promote a Product
    app.put('/products/:id', async (req, res) => {
        const id = req.params.id;
        const update = req.body;
        const filter = { _id: ObjectId(id) }
        const options = { upsert: true };
        const updatedProduct = {
            $set: update
        }
        const result = await productsCollection.updateOne(filter, updatedProduct, options)
        res.send(result)
    })
    //Delete a Specific product from listing
    app.delete('/products/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) }
        const result = await productsCollection.deleteOne(query);
        res.send(result)
    })
    //Get all booked products
    app.get('/booked', async (req, res) => {
        const query = {
            booked: true
        }
        const bookedProduct = await productsCollection.find(query).toArray()
        res.send(bookedProduct)
    })
    //Get a Booked Product for a specific buyer
    app.get('/mypurchase', verifyToken, async (req, res) => {
        const email = req.query.email
        const decoded = req.decoded
        if (decoded.email !== email) {
            return res.status(403).send({ message: 'Data Forbidden for you' })
        }
        const query = { buyerEmail: email }
        const result = await productsCollection.find(query).toArray()
        res.send(result)
    })
    //Save new user to the Database
    app.post('/users', async (req, res) => {
        const user = req.body;
        const query = {
            email: user.email
        }
        const exists = await users.find(query).toArray()
        if (exists.length) {
            return res.send({ message: 'User Already Exists' })
        }
        const result = await users.insertOne(user)
        res.send(result)
    })
    //Get All users from the database
    app.get('/users', async (req, res) => {
        const query = {}
        const allUser = await users.find(query).toArray()
        res.send(allUser)
    })
    //Get a Specific user //Logged In from the database
    app.get('/user', async (req, res) => {
        const email = req.query.email
        const query = {
            email: email
        }
        const user = await users.find(query).toArray()
        res.send(user)
    })
    //Get All Buyers from the database
    app.get('/users/buyers', async (req, res) => {
        const query = {
            accountType: 'Buyer'
        }
        const buyers = await users.find(query).toArray()
        res.send(buyers)
    })
    //Get All Seller from the database
    app.get('/users/sellers', async (req, res) => {
        const query = {
            accountType: 'Seller'
        }
        const sellers = await users.find(query).toArray()
        res.send(sellers)
    })
    //Delete a user
    app.delete('/users/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: ObjectId(id) }
        const result = await users.deleteOne(query)
        res.send(result)
    })
    //Update a User
    app.put('/users/:id', async (req, res) => {
        const id = req.params.id
        const filter = { _id: ObjectId(id) }
        const update = req.body
        const options = { upsert: true }
        const updatedUser = {
            $set: update
        }
        const result = await users.updateOne(filter, updatedUser, options)
        res.send(result)
    })

    //Post a Blog
    app.post('/blogs', async (req, res) => {
        const blog = req.body
        const result = await blogs.insertOne(blog)
        res.send(result)
    })

    //Get all blogs
    app.get('/blogs', async (req, res) => {
        const query = {}
        const result = await blogs.find(query).toArray()
        res.send(result)
    })

    //Get a specific blog 
    app.get('/blogs/:id', async (req, res) => {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const blog = await blogs.find(query).toArray()
        res.send(blog)
    })

    //Create api for create payment intension
    app.post('/payment-intent', async (req, res) => {
        const product = req.body;
        const price = product.resalePrice;
        const paymentAmount = price * 100;

        const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: paymentAmount,
            "payment_method_types": [
                "card"
            ]
        });
        res.send({
            clientSecret: paymentIntent.client_secret,
        })
    })
}

dbConnect()
//Default Route
app.get('/', (req, res) => {
    res.send('Dealogic Server is Running....')
})

//Add a Listener to the app
app.listen(port, () => {
    console.log('Server Running on Port:', port);
})