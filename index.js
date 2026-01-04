const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.port || 3000;
const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const verifyFBToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  try {
    const idToken = token.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    //console.log("decoded in the token", decoded);
    req.decoded_email = decoded.email;
    next();
  } catch (err) {
    return res.status(401).send({ message: "unauthorized access" });
  }
};

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
    const userCollection = db.collection("users");
    const coursecollection = db.collection("courses");
    const enrolledcollection = db.collection("enrolled");
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded_email;
      const query = { email };
      const user = await userCollection.findOne(query);

      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "forbidden access" });
      }

      next();
    };
    //user
    app.get("/users", verifyFBToken, async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.email = email;
      }
      const cursor = await userCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/users/:id/role", verifyFBToken, async (req, res) => {
      const email = req.params.id;
      const query = {};
      if (email) {
        query.email = email;
      }
      const result = await userCollection.findOne(query);
      res.send(result);
    });
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.createdAt = new Date();
      const email = user.email;
      const userExists = await userCollection.findOne({ email });

      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.patch(
      "/users/:id/role",
      verifyFBToken,
      verifyAdmin,
      async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const user = req.body;
        // console.log("hited user");
        const update = { $set: user };
        if (user?.role === "fraud") {
          await bookedcourseCollection.updateMany(
            { createdBy: user.email },
            { $set: { state: "hidden" } }
          );

          await coursesCollection.updateMany(
            { email: user.email },
            { $set: { state: "hidden" } }
          );
        } else {
          await bookedcourseCollection.updateMany(
            { createdBy: user.email },
            { $set: { state: "pending" } }
          );

          await coursesCollection.updateMany(
            { email: user.email },
            { $set: { state: "pending" } }
          );
        }

        const result = await userCollection.updateOne(query, update);
        res.send(result);
      }
    );
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
    app.get("/payments", verifyFBToken, async (req, res) => {
      const customerEmail = req.query.email;
      const query = {};
      if (customerEmail) {
        query.customerEmail = customerEmail;
      }
      const cursor = await paymentCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.post("/payment-checkout-session", verifyFBToken, async (req, res) => {
      const courseInfo = req.body;
      const amount = parseInt(courseInfo.cost * 100);
      //console.log("got it");
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amount,
              product_data: {
                name: `please pay for: ${courseInfo.title}`,
              },
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          courseId: courseInfo.courseId,
          bookedcourseId: courseInfo.bookedcourseId,
          quantity: courseInfo.quantity,
          title: courseInfo.title,
        },
        customer_email: courseInfo.email,
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancelled`,
      });

      res.send({ url: session.url });
    });
    app.patch("/payment-success", verifyFBToken, async (req, res) => {
      const sessionId = req.query.session_id;
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      const amount = parseInt(session.amount_total / 100);

      const transactionId = session.payment_intent;
      // console.log("session retrieve --", session);
      //console.log("session retrieve --", session.payment_intent);

      const query = { transactionId: transactionId };

      const paymentExist = await paymentCollection.findOne(query);
      // console.log(session.metadata);
      if (paymentExist) {
        return res.send({
          message: "already exists",
          transactionId,
          trackingId: paymentExist._id,
          bookedcourseId: paymentExist.bookedcourseId,
        });
      }

      const trackingId = session.metadata.courseId;
      const bookedcourseId = session.metadata.bookedcourseId;
      const courseId = session.metadata.courseId;
      const course = await coursesCollection.findOne({
        _id: new ObjectId(courseId),
      });
      const revenueData = await revenueCollection.findOne({
        email: course.email,
      });

      if (session.payment_status === "paid") {
        const id = session.metadata.bookedcourseId;
        const idb = session.metadata.courseId;
        const query = { _id: new ObjectId(id) };
        const queryb = { _id: new ObjectId(idb) };
        const update = {
          $set: {
            state: "paid",
          },
        };
        const updateb = {
          $set: {
            quantity:
              Number(course.quantity) - Number(session.metadata.quantity),
            revenue: Number(course?.revenue) + Number(amount),
          },
        };

        // console.log(
        //   "recived 1",
        //   session.metadata.quantity,
        //   transactionId,
        //   paymentExist ? "true" : "false"
        // );
        const result = await bookedcourseCollection.updateOne(query, update);
        const resultb = await coursesCollection.updateOne(queryb, updateb);
        // console.log(amount);
        if (revenueData) {
          const revenueUpdate = {
            $set: {
              amount: Number(revenueData.amount + amount),
              quantity: Number(
                Number(revenueData.quantity) + Number(session.metadata.quantity)
              ),
              // revenue: Number(course?.revenue) + Number(amount),
            },
          };
          const revenueResult = await revenueCollection.updateOne(
            { email: course.email },
            revenueUpdate
          );
        } else {
          const newRevenue = {
            email: course.email,
            amount: amount,
            // courseId: course._id,
            quantity: Number(session.metadata.quantity),
          };

          const revenueResult = await revenueCollection.insertOne(newRevenue);
        }

        const payment = {
          amount: amount,
          quantity: session.metadata.quantity,
          currency: session.currency,
          customerEmail: session.customer_email,
          courseId: session.metadata.courseId,
          title: session.metadata.title,
          transactionId: session.payment_intent,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
          trackingId: trackingId,
        };

        const resultPayment = await paymentCollection.insertOne(payment);

        return res.send({
          success: true,
          modify: result,
          _id: trackingId,
          transactionId: session.payment_intent,
          paymentInfo: resultPayment,
        });
      }
      return res.send({ success: false });
    });
    app.get("/revenues", verifyFBToken, verifyVendor, async (req, res) => {
      // const state = req.query.state;
      const email = req.query.email;
      const query = {};
      // if (state) {
      //   query.state = state;
      // }
      if (email) {
        query.email = email;
      }

      const courses = await coursesCollection.find(query);
      const coursesArray = await courses.toArray();
      let totalcourse = 0;

      for (const t of coursesArray) {
        totalcourse += Number(t.quantity);
      }

      const cursor = await revenueCollection.find(query);
      let result = await cursor.toArray();
      if (result.length > 0) {
        result[0].totalcourse = Number(result[0].quantity) + totalcourse;
        res.send(result);
      } else {
        // console.log("here");
        res.send([
          {
            _id: "69415ab7405c0b22569de4cb",
            email: query?.email,
            amount: 0,
            quantity: 0,
            totalcourse: totalcourse,
          },
        ]);
      }
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
