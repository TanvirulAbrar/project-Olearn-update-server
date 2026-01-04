const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.port || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sobgiis.mongodb.net/?appName=Cluster0`;
// const uri = `mongodb://localhost:27017`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("smart");
});
async function run() {
  try {
    // await client.connect();

    const db = client.db("a10");
    const coursecollection = db.collection("courses");
    const enrolledcollection = db.collection("enrolled");
    //enrolled
    app.get("/enroll", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }

      const cursor = enrolledcollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/enroll/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await enrolledcollection.findOne(query);
      res.send(result);
    });
    app.post("/enroll", async (req, res) => {
      const newp = req.body;
      const result = await enrolledcollection.insertOne(newp);
      res.send(result);
    });
    app.patch("/enroll/:id", async (req, res) => {
      const id = req.params.id;
      const newp = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: newp,
      };
      console.log("id update hit");
      const result = await enrolledcollection.updateOne(query, update);
      res.send(result);
    });
    app.delete("/enroll/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: new ObjectId(id) };
      const result = await enrolledcollection.deleteOne(queary);
      res.send(result);
    });
    // course
    app.get("/courses", async (req, res) => {
      const cursor = coursecollection.find().sort({ price: 1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await coursecollection.findOne(query);
      res.send(result);
    });
    app.post("/courses", async (req, res) => {
      const newp = req.body;
      const result = await coursecollection.insertOne(newp);
      res.send(result);
    });

    app.delete("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const queary = { _id: new ObjectId(id) };
      const result = await coursecollection.deleteOne(queary);
      res.send(result);
    });
    app.patch("/courses/:id", async (req, res) => {
      const id = req.params.id;
      const newp = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: newp,
      };
      const result = await coursecollection.updateOne(query, update);
      res.send(result);
    });
    // await client.db("admin").command({ ping: 1 });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`running${port}`);
});
