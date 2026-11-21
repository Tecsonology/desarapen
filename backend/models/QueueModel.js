
const mongoose = require("mongoose")


const queueSchema = new mongoose.Schema({
    queueNumber: {
        type: Number,
        required: true
    },

    orders: {
        type: [mongoose.Schema.Types.Mixed],
        required: true
    },

    time: {
        type: Date,
        default: Date.now
    },

    status: {
        type: String,
        enum: ["pending", "preparing", "done"],
        default: "pending"
    }

}, {
    timestamps: true
});

module.exports =  mongoose.model("Queue", queueSchema);
