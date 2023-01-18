const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const e = require('express');


const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m0uwqii.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const shopsCollection = client.db('ezectric_electrical').collection('shops');
    const bookingCollection = client.db('ezectric_electrical').collection('bookings');
    const userCollection = client.db('ezectric_electrical').collection('users');

    //product data api
    app.get('/shops', async (req, res) => {
      const query = {};
      const cursor = shopsCollection.find(query);
      const shops = await cursor.toArray();
      res.send(shops);
    })
    //product data end
    //login user Email get
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({ result, token });
    })

    // login user Email get end


    // order get dashboard

    app.get('/booking', async (req, res) => {
      const customerEmail = req.query.customerEmail;
      const authorization = req.headers.authorization
      console.log('auth header', authorization)
      const query = { customerEmail: customerEmail };
      const bookings = await bookingCollection.find(query).toArray();
      res.send(bookings)
    })

    // order get dashboard end

    //bookings orders
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    //booking order end

  }
  finally {

  }
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('ezectric electrical Hello World!')
})

app.listen(port, () => {
  console.log(`ezectric electrical listening on port ${port}`)
})