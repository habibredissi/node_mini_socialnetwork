const express = require("express")
const users = express.Router()
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")

const User = require("../models/User")
users.use(cors())

process.env.SECRET_KEY = 'secret'

users.post('/register', (req, res) => {
    const today = new Date()
    const userData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        created: today
    }

    User.findOne({
            email: req.body.email
        })
        .then(user => {
            if (!user) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    userData.password = hash
                    User.create(userData)
                        .then(user => {
                            res.json({
                                status: user.email + ' registered!'
                            })
                        })
                        .catch(err => {
                            res.send('error: ' + err)
                        })
                })
            } else {
                res.json({
                    error: 'User already exists'
                })
            }
        })
        .catch(err => {
            res.send('error: ' + err)
        })
})

users.post('/login', (req, res) => {
    User.findOne({
            email: req.body.email
        })
        .then(user => {
            if (user) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    const payload = {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        followers: user.followers,
                        following: user.following
                    }
                    let token = jwt.sign(payload, process.env.SECRET_KEY, {
                        expiresIn: 1440
                    })
                    res.send(token)
                } else {
                    res.json({
                        error: "User does not exist"
                    })
                }
            } else {
                res.json({
                    error: "User does not exist"
                })
            }
        })
        .catch(err => {
            res.send('error: ' + err)
        })
})

users.get('/profile', (req, res) => {
    var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)

    User.findOne({
            _id: decoded._id
        })
        .then(user => {
            if (user) {
                res.json(user)
            } else {
                res.send("User does not exist")
            }
        })
        .catch(err => {
            res.send('error: ' + err)
        })
})

users.delete('/:userId', (req, res) => {
    var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)

    User.remove({
            _id: decoded._id
        })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "User deleted"
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
})

users.put('/:userId', (req, res) => {
    var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)
    User.update({
            _id: decoded._id
        }, {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            email: req.body.email
        })
        .exec()
        .then(result => {
            const payload = {
                _id: req.params.userId,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                email: req.body.email
            }
            let token = jwt.sign(payload, process.env.SECRET_KEY, {
                expiresIn: 1440
            })
            res.send(token)
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

users.get("/", (req, res, next) => {
    User.find()
        .exec()
        .then(doc => {
            console.log("From database", doc);
            if (doc) {
                res.status(200).json({
                    users: doc
                });
            } else {
                res
                    .status(404)
                    .json({
                        message: "Error!"
                    });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

users.put('/follow/:userId', (req, res) => {
    User.update({
            _id: req.params.userId
        }, {
            $addToSet: {
                following: req.body.followingUser
            }
        })
        .exec()
        .then(result => {
            User.update({
                    _id: req.body.followingUser
                }, {
                    $addToSet: {
                        followers: req.params.userId
                    }
                }).exec()
                .then(
                    res.status(200).json({
                        message: "Success"
                    })
                )
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        error: err
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

users.put('/unfollow/:userId', (req, res) => {
    User.update({
            _id: req.params.userId
        }, {
            $pull: {
                following: req.body.followingUser
            }
        })
        .exec()
        .then(result => {
            User.update({
                    _id: req.body.followingUser
                }, {
                    $pull: {
                        followers: req.params.userId
                    }
                }).exec()
                .then(
                    res.status(200).json({
                        message: "Success"
                    })
                )
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        error: err
                    });
                });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

users.put('/block/:userId', (req, res) => {
    User.update({
            _id: req.params.userId
        }, {
            $addToSet: {
                blocked: req.body.blocked
            }
        })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "User blocked"
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

module.exports = users