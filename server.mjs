import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { stringToHash, varifyHash } from "bcrypt-inzi";

const SECRET = process.env.SECRET || "topsecret";

const app = express();
const port = process.env.PORT || 5001;
const mongodbURI =
  process.env.mongodbURI ||
  "mongodb+srv://seconddb:dbsecond@cluster0.0t9dcns.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// app.use(cors({
//   origin: ['http://localhost:3000', "*"],
//   credentials: true
// }));

let productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number,
  createdOn: { type: Date, default: Date.now },
});
const productModel = mongoose.model("products2", productSchema);

const userSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
});
const userModel = mongoose.model("User", userSchema);

app.post("/signup", (req, res) => {
  let body = req.body;

  if (!body.firstName || !body.lastName || !body.email || !body.password) {
    res.status(400).send(
      `required fields missing, request example: 
                {
                    "firstName": "John",
                    "lastName": "Doe",
                    "email": "abc@abc.com",
                    "password": "12345"
                }`
    );
    return;
  }

  req.body.email = req.body.email.toLowerCase();

  // check if user already exist // query email user
  userModel.findOne({ email: body.email }, (err, user) => {
    if (!err) {
      console.log("user: ", user);

      if (user) {
        // user already exist
        console.log("user already exist: ", user);
        res
          .status(400)
          .send({
            message: "user already exist,, please try a different email",
          });
        return;
      } else {
        // user not already exist

        stringToHash(body.password).then((hashString) => {
          userModel.create(
            {
              firstName: body.firstName,
              lastName: body.lastName,
              email: body.email.toLowerCase(),
              password: hashString,
            },
            (err, result) => {
              if (!err) {
                console.log("data saved: ", result);
                res.status(201).send({ message: "user is created" });
              } else {
                console.log("db error: ", err);
                res.status(500).send({ message: "internal server error" });
              }
            }
          );
        });
      }
    } else {
      console.log("db error: ", err);
      res.status(500).send({ message: "db error in query" });
      return;
    }
  });
});

app.post("/login", (req, res) => {
  let body = req.body;
  body.email = body.email.toLowerCase();

  if (!body.email || !body.password) {
    // null check - undefined, "", 0 , false, null , NaN
    res.status(400).send(
      `required fields missing, request example: 
              {
                  "email": "abc@abc.com",
                  "password": "12345"
              }`
    );
    return;
  }

  // check if user already exist // query email user
  userModel.findOne(
    { email: body.email },

    "email password",
    (err, data) => {
      if (!err) {
        console.log("data: ", data);

        if (data) {
          // user found
          varifyHash(body.password, data.password).then((isMatched) => {
            console.log("isMatched: ", isMatched);

            if (isMatched) {
              var token = jwt.sign(
                {
                  _id: data._id,
                  email: data.email,
                  iat: Math.floor(Date.now() / 1000) - 30,
                  exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
                },
                SECRET
              );

              console.log("token: ", token);

              res.cookie("Token", token, {
                maxAge: 86_400_000,
                httpOnly: true,
              });

              res.send({
                message: "login successful",
                profile: {
                  email: data.email,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  age: data.age,
                  _id: data._id,
                },
              });
              return;
            } else {
              console.log("user not found");
              res.status(401).send({ message: "Incorrect email or password" });
              return;
            }
          });
        } else {
          // user not already exist
          console.log("user not found");
          res.status(401).send({ message: "Incorrect email or password" });
          return;
        }
      } else {
        console.log("db error: ", err);
        res.status(500).send({ message: "login failed, please try later" });
        return;
      }
    }
  );
});

app.post("/logout", (req, res) => {
  res.cookie("Token", "", {
    maxAge: 1,
    httpOnly: true,
  });

  res.send({ message: "Logout successful" });
});

app.use((req, res, next) => {
  console.log("req.cookies: ", req.cookies);

  if (!req?.cookies?.Token) {
    res.status(401).send({
      message: "include http-only credentials with every request",
    });
    return;
  }
  jwt.verify(req.cookies.Token, SECRET, function (err, decodedData) {
    if (!err) {
      console.log("decodedData: ", decodedData);

      const nowDate = new Date().getTime() / 1000;

      if (decodedData.exp < nowDate) {
        res.status(401);
        res.cookie("Token", "", {
          maxAge: 1,
          httpOnly: true,
        });
        res.send({ message: "token expired" });
      } else {
        console.log("token approved");

        req.body.token = decodedData;
        next();
      }
    } else {
      res.status(401).send("invalid token");
    }
  });
});

app.post("/product", (req, res) => {
  const body = req.body;

  if (
    // validation
    !body.name ||
    !body.price ||
    !body.description
  ) {
    res.status(400).send({
      message: "required parameters missing",
    });
    return;
  }

  console.log(body.name);
  console.log(body.price);
  console.log(body.description);

  // products.push({
  //     id: `${new Date().getTime()}`,
  //     name: body.name,
  //     price: body.price,
  //     description: body.description
  // });

  productModel.create(
    {
      name: body.name,
      price: body.price,
      description: body.description,
    },
    (err, saved) => {
      if (!err) {
        console.log(saved);

        res.send({
          message: "product added successfully",
        });
      } else {
        res.status(500).send({
          message: "server error",
        });
      }
    }
  );

  // res.send({
  //     message: "product added successfully"
  // });
});

app.get("/products", (req, res) => {
  // res.send({
  //     message: "got all products successfully",
  //     data: products
  // })

  productModel.find({}, (err, data) => {
    if (!err) {
      res.send({
        message: "got all products successfully",
        data: data,
      });
    } else {
      res.status(500).send({
        message: "server error",
      });
    }
  });
});

app.get("/product/:id", (req, res) => {
  const id = req.params.id;

  // let isFound = false;
  // for (let i = 0; i < products.length; i++) {

  //     if (products[i].id === id) {
  //         res.send({
  //             message: `get product by id: ${products[i].id} success`,
  //             data: products[i]
  //         });

  //         isFound = true
  //         break;
  //     }
  // }
  // if (isFound === false) {
  //     res.status(404)
  //     res.send({
  //         message: "product not found"
  //     });
  // }
  // return;

  productModel.findOne({ _id: id }, (err, data) => {
    if (!err) {
      if (data) {
        res.send({
          message: `get product by id: ${data._id} success`,
          data: data,
        });
      } else {
        res.status(404).send({
          message: "product not found",
        });
      }
    } else {
      res.status(500).send({
        message: "server error",
      });
    }
  });
});

app.delete("/product/:id", (req, res) => {
  const id = req.params.id;

  productModel.deleteOne({ _id: id }, (err, deletedData) => {
    console.log("deleted: ", deletedData);
    if (!err) {
      if (deletedData.deletedCount !== 0) {
        res.send({
          message: "Product has been deleted successfully",
        });
      } else {
        res.status(404);
        res.send({
          message: "No Product found with this id: " + id,
        });
      }
    } else {
      res.status(500).send({
        message: "server error",
      });
    }
  });
});

app.put("/product/:id", async (req, res) => {
  const body = req.body;
  const id = req.params.id;

  if (
    // validation
    !body.name ||
    !body.price ||
    !body.description
  ) {
    res.status(400).send({
      message: "required parameters missing",
    });
    return;
  }

  //   console.log(body.name);
  //   console.log(body.price);
  //   console.log(body.description);

  // let isFound = false;
  // for (let i = 0; i < products.length; i++) {
  //     if (products[i].id === id) {

  //         products[i].name = body.name;
  //         products[i].price = body.price;
  //         products[i].description = body.description;

  //         res.send({
  //             message: "product modified successfully"
  //         });
  //         isFound = true
  //         break;
  //     }
  // }
  // if (!isFound) {
  //     res.status(404)
  //     res.send({
  //         message: "edit fail: product not found"
  //     });
  // }
  // res.send({
  //     message: "product added successfully"
  // });

  try {
    let data = await productModel
      .findByIdAndUpdate(
        id,
        {
          name: body.name,
          price: body.price,
          description: body.description,
        },
        { new: true }
      )
      .exec();

    console.log("updated: ", data);

    res.send({
      message: "product modified successfully",
    });
  } catch (error) {
    res.status(500).send({
      message: "server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

/////////////////////////////////////////////////////////////////////////////////////////////////
mongoose.connect(mongodbURI);

////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on("connected", function () {
  //connected
  console.log("Mongoose is connected");
});

mongoose.connection.on("disconnected", function () {
  //disconnected
  console.log("Mongoose is disconnected");
  process.exit(1);
});

mongoose.connection.on("error", function (err) {
  //any error
  console.log("Mongoose connection error: ", err);
  process.exit(1);
});

process.on("SIGINT", function () {
  /////this function will run jst before app is closing
  console.log("app is terminating");
  mongoose.connection.close(function () {
    console.log("Mongoose default connection closed");
    process.exit(0);
  });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////
