require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
const verifyJwt = require("./middleware/verifyJwt");

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

    const usersCollection = client.db("doctors-portal").collection("users");
    const doctorsCollection = client.db("doctors-portal").collection("doctors");

    //Admin check middleware
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user.role !== "admin") {
        return res.status(403).send("Unauthorized");
      }
    };

    app.get("/appoinmentOptions", async (req, res) => {
      //find the selectedDate's all bookings
      /* const currentDate = req.query.date;
      const bookingFilter = { date: currentDate };
      const AlreadyBookedOptions = await bookingCollection
        .find(bookingFilter)
        .toArray();
      console.log(AlreadyBookedOptions);

      //getting all options
      const query = {};
      const appoinmentOptions = await appoinmentCollection
        .find(query)
        .toArray();

      appoinmentOptions.map((option) => {
        const optionBooked = AlreadyBookedOptions.filter(
          (book) => book.name === option.name
        );
        const bookedSlots = optionBooked.map((boot) => book.slot);
        const remainingSlots = option.slots.filter((slot) =>
          bookedSlots.includes(slot)
        );
        option.slots = remainingSlots;
      }); */

      // Get all the options
      const optionsQuery = {};
      const options = await appoinmentCollection.find(optionsQuery).toArray();

      // Get all the current date's bookings
      const currentDate = req.query.date;
      const bookedOptionsQuery = { appoinmentDate: currentDate };

      const alreadyBookedOptions = await bookingCollection
        .find(bookedOptionsQuery)
        .toArray();

      options.map((option) => {
        alreadyBookedOptions.map((bookedOption) => {
          if (bookedOption.treatment === option.name) {
            const remainingSlots = option.slots.filter(
              (slot) => slot !== bookedOption.slot
            );

            option.slots = remainingSlots;
          }
        });
      });

      res.send(options);
    });

    app.get("/appoinmentSpeciality", async (req, res) => {
      const query = {};
      const result = await appoinmentCollection
        .find(query)
        .project({ name: 1 })
        .toArray();

      res.send(result);
    });

    app.get("/bookings", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await bookingCollection.find(query).toArray();

      res.send(result);
    });

    app.post("/bookings", verifyJwt, async (req, res) => {
      const booking = req.body;
      const query = {
        email: booking.email,
        appoinmentDate: booking.appoinmentDate,
        treatment: booking.treatment,
      };

      const booked = await bookingCollection.find(query).toArray();
      if (booked.length) {
        return res.send({
          acknowledged: false,
          message: `You already have an booking on ${booking.appoinmentDate}`,
        });
      }
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const result = await usersCollection.insertOne(user);

      res.send(result);
    });

    app.get("/users/admin/:email", async (req, res) => {
      const query = { email: req.params.email };
      const user = await usersCollection.findOne(query);

      res.send({ isAdmin: user?.role === "admin" });
    });

    app.put("/users/:id", verifyJwt, verifyAdmin, async (req, res) => {
      const filter = { _id: ObjectId(req.params.id) };
      console.log(req.query.id);
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const query = {};
      const result = await usersCollection.find(query).toArray();

      res.send(result);
    });

    app.get("/doctors", async (req, res) => {
      const query = {};
      const result = await doctorsCollection.find(query).toArray();

      res.send(result);
    });

    app.post("/doctors", async (req, res) => {
      const doctor = req.body;

      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
    });

    app.delete("/doctors/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      console.log("🚀 ~ file: index.js ~ line 199 ~ app.delete ~ id", id);

      const result = await doctorsCollection.deleteOne(filter);
      res.send(result);
    });

    app.get("/jwt", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      if (user) {
        const token = jwt.sign({ user }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });

        return res.json({ token: token });
      }

      return res.json({ token: "Unauthorized" });
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
