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

// All UserEmail start
app.get('/user', verifyJWT, async(req,res) => {
  const users = await userCollection.find().toArray();
  res.send(users);
})

// All UserEmail end


//Make a Admin start

app.put('/user/admin/:email',verifyJWT, async (req, res) => {
  const email = req.params.email;
  const filter = { email: email };
  const updateDoc = {
    $set:{role:'admin'} ,
  };
  const result = await userCollection.updateOne(filter, updateDoc);
  
  res.send(result );
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


    // order get dashboard

    app.get('/booking',verifyJWT, async (req, res) => {
      const customerEmail = req.query.customerEmail;
     const decodedEmaill =req.query.customerEmail;
     if(customerEmail === decodedEmaill){
      const query = { customerEmail: customerEmail };
      const bookings = await bookingCollection.find(query).toArray();
      return res.send(bookings);
     }
      else{
        return res.status(403).send({message:'forbidden access'});

      }
    })

    // app.get('/booking',verifyJWT, async (req, res) => {
    //   const customerEmail = req.query.customerEmail
    //   //  const authorization = req.headers.authorization
    //   const query = {customerEmail: customerEmail};
    //   const bookings = await bookingCollection.find(query).toArray();
    //   res.send(bookings)

    // })

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