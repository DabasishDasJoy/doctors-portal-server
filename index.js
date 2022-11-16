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

    app.post("/bookings", async (req, res) => {
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
