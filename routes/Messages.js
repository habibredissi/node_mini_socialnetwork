const express = require("express");
const messages = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const Message = require("../models/Message");
const User = require("../models/User")
messages.use(cors());

process.env.SECRET_KEY = "secret";

messages.post("/publish", (req, res) => {
  var decoded = jwt.verify(
    req.headers["authorization"],
    process.env.SECRET_KEY
  );
  if (decoded._id) {
    const today = new Date();
    const messageData = {
      userId: decoded._id,
      first_name: decoded.first_name,
      last_name: decoded.last_name,
      message: req.body.message,
      created: today
    };
    Message.create(messageData)
      .then(result => {
        console.log(messageData);
        res.json({
          status: "Message created!"
        });
      })
      .catch(err => {
        res.send("error: " + err);
      });
  } else {
    res.json({
      error: "Error Token !"
    });
  }
});

messages.delete("/:messageId", (req, res) => {
  var decoded = jwt.verify(
    req.headers["authorization"],
    process.env.SECRET_KEY
  );
  if (decoded) {
    Message.remove({
        _id: req.params.messageId
      })
      .exec()
      .then(result => {
        res.status(200).json({
          message: "Message deleted"
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
  } else {
    res.json({
      error: "Error Token !"
    });
  }
});

messages.put("/:messageId", (req, res) => {
  var decoded = jwt.verify(
    req.headers["authorization"],
    process.env.SECRET_KEY
  );
  Message.update({
      _id: req.params.messageId
    }, {
      message: req.body.message
    })
    .exec()
    .then(result => {
      res.status(200).json({
        message: "Message updated!"
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });
});

messages.get("/:userId", async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.userId
  }).exec();
  console.log(user.following);
  user.following.push(req.params.userId);
  user.following = user.following.filter(function (el) {
    return user.blocked.indexOf(el) < 0;
  });

  const msg = await Message.find({
      userId: {
        $in: user.following
      }
    }).exec().then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json({
          message: doc
        });
      } else {
        res
          .status(404)
          .json({
            message: "No valid entry found for provided ID"
          });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({
        error: err
      });
    });


  //   console.log(req.params.userId);
  // const id = req.params.userId;
  // Message.find()
  //   .exec()
  // .then(doc => {
  //     console.log("From database", doc);
  //     if (doc) {
  //       res.status(200).json({
  //         message: doc
  //       });
  //     } else {
  //       res
  //         .status(404)
  //         .json({
  //           message: "No valid entry found for provided ID"
  //         });
  //     }
  //   })
  //   .catch(err => {
  //     console.log(err);
  //     res.status(500).json({
  //       error: err
  //     });
  //   });
});

module.exports = messages;