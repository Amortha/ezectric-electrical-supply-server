const express = require('express')
const cors = require('cors');
require ('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express()
const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.m0uwqii.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
try{
    await client.connect();
   const shopsCollection = client.db('ezectric_electrical').collection('shops');

   app.get('/shops',async(req,res) =>{
    const query ={};
    const cursor = shopsCollection.find(query);
    const  shops = await cursor.toArray();
    res.send(shops);
   })
}
finally{

}
}

run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('ezectric electrical Hello World!')
})

app.listen(port, () => {
  console.log(`ezectric electrical listening on port ${port}`)
})