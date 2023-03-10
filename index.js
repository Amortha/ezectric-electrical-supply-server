const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())

//mongodb pass and user
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m0uwqii.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

//JWT token start
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    await client.connect();
    //browser collection name 
    const shopsCollection = client.db('ezectric_electrical').collection('shops');
    const reviewsCollection = client.db('ezectric_electrical').collection('reviews');
    const bookingCollection = client.db('ezectric_electrical').collection('bookings');
    const userCollection = client.db('ezectric_electrical').collection('users');
    const paymentCollection = client.db('ezectric_electrical').collection('payments');


    //payment method start
    app.post('/cerate-payment-intent', verifyJWT, async (req, res) => {
      const shop = req.body;
      const price = shop.price;
      const amount = price * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });
      res.send({ clientSecret: paymentIntent.client_secret })
    });
    //payment method end

    //product data api
    app.get('/shops', async (req, res) => {
      const query = {};
      const cursor = shopsCollection.find(query);
      const shops = await cursor.toArray();
      res.send(shops);
    })
    //product data end

    //review data api start
    app.get('/reviews', async (req, res) => {
      const query = {};
      const cursor = reviewsCollection.find(query);
      const shops = await cursor.toArray();
      res.send(shops);
    })
    // review data api end

    //Add new Product data start
    app.post('/shops', async (req, res) => {
      const newShops = req.body;
      const result = await shopsCollection.insertOne(newShops)
      res.send(result);
    })
    //Add new Product data end

    //add new customar review start
    app.post('/reviews', async (req, res) => {
      const newReview = req.body;
      const result = await reviewsCollection.insertOne( newReview)
      res.send(result);
    })
    //add new customar review end

    // All UserEmail start
    app.get('/user', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    })

    // All UserEmail end

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
    })


    //Make a Admin start

    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {

        const filter = { email: email };
        const updatedDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);

        res.send(result);

      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }

    })

    //Make a Admin end
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

    //payment data mathod start
    app.patch('/booking/:id', verifyJWT, async (req, res) => {

      const id = req.params.id;
      const payment = req.body;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId
        }
      }
      const result = await paymentCollection.insertOne(payment);
      const updateBooking = await bookingCollection.updateOne(filter, updatedDoc)
      res.send(updatedDoc);
    })

    //payment data mathod end


    // order get dashboard

    app.get('/booking', verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
      const decodedEmaill = req.query.customerEmail;
      if (customerEmail === decodedEmaill) {
        const query = { customerEmail: customerEmail };
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      }
      else {
        return res.status(403).send({ message: 'forbidden access' });

      }
    });


    // app.get('/booking',verifyJWT, async (req, res) => {
    //   const customerEmail = req.query.customerEmail
    //   //  const authorization = req.headers.authorization
    //   const query = {customerEmail: customerEmail};
    //   const bookings = await bookingCollection.find(query).toArray();
    //   res.send(bookings)

    // })

    // order get dashboard end

    // payment data start

    app.get('/booking/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingCollection.findOne(query);
      res.send(booking)

    })
    // payment data end

    //bookings orders
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    //booking order end


    //Delete Manage Product start
    app.delete('/shops/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await shopsCollection.deleteOne(query);
      res.send(result)
    })
    //Delete Manage Product end
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