const mongoose = require("mongoose")
const Schema = mongoose.Schema

const UserSchema = new Schema({
    userId: {
        type: String
    },
    message: {
        type: String
    },
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    }
})

module.exports = Message = mongoose.model('messages', UserSchema)