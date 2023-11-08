const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: ['https://feed-the-hunger-server-7dk4ehmpc-jamil-hasans-projects.vercel.app']
}));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jlioc3w.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db("foodDB").collection("foods");
    const foodRequests = client.db("foodDB").collection("foodRequests");


    app.get("/foods", async (req, res) => {
      const query = { foodStatus: "available" };
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/foods/:foodId", async (req, res) => {
      const id = req.params.foodId;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });

    app.get("/featuredFoods", async (req, res) => {
      const result = await foodCollection
        .aggregate([
          {
            $match: {
              foodStatus: "available",
            },
          },
          {
            $addFields: {
              qtyAsNumber: { $toInt: "$foodQty" },
            },
          },
          {
            $sort: { qtyAsNumber: -1 },
          },
        ])
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.get("/myFoods", async (req, res) => {
      const email = req.query.userEmail;
      const query = { donorEmail: email };
      const result = await foodCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/manage/:id", async (req, res) => {
      const id = req.params.id;
      const query = { foodId: id };
      const result = await foodRequests.find(query).toArray();
      res.send(result);
    });

    app.get("/myRequests", async (req, res) => {
      const email = req.query.userEmail;
      const query = { reqEmail: email };
      const result = await foodRequests.find(query).toArray();
      res.send(result);
    });

    app.post("/addFood", async (req, res) => {
      const newFood = req.body;
      const result = await foodCollection.insertOne(newFood);
      res.send(result);
    });

    app.post("/requestFood", async (req, res) => {
      const newFood = req.body;
      const result = await foodRequests.insertOne(newFood);
      res.send(result);
    });

    app.patch("/editFood/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = {
        $set: req.body,
      };
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.updateOne(query, updatedFood);
      res.send(result);
    });

    app.patch("/foodStatus/:id", async (req, res) => {
      const id = req.params.id;
      const updatedFood = {
        $set: req.body,
      };
      const query = { _id: new ObjectId(id) };
      const result = await foodRequests.updateOne(query, updatedFood);
      res.send(result);
    });

    app.delete("/foodDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });

    app.delete("/cancelRequest/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodRequests.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("FeedtheHunger is available");
});

app.listen(port, () => {
  console.log(`feedthehunger server is running on port: ${port}`);
});
