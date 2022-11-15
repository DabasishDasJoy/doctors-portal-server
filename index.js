require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const port = process.env.PORT || 5000;

const app = express();

//middleware

app.use(cors());
app.use(express.json());

//routes
app.get("/", (req, res) => {
  res.send("Doctors portal server is running");
});

//database connection
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_password}@cluster0.mj0nqa8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//routes
const run = async () => {
  try {
    const appoinmentCollection = client
      .db("doctors-portal")
      .collection("appoinmentOptions");

    const bookingCollection = client
      .db("doctors-portal")
      .collection("bookings");

    app.get("/appoinmentOptions", async (req, res) => {
      const query = {};
      const appoinmentOptions = await appoinmentCollection
        .find(query)
        .toArray();

      res.send(appoinmentOptions);
    });

    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      console.log(result);
      res.send(result);
    });
  } finally {
  }
};

run().catch(console.dir);
app.listen(port, () => {
  client.connect((err) => {
    if (err) {
      console.log("DB Error", err);
    } else {
      console.log("DB connected");
    }
  });

  console.log(`Doctors portal server listening on port ${port}`);
});
