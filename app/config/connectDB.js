const config = require("./config");
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

const connectDB = async () => {
    return new Promise((resolve, reject) => {
        mongoose
            .connect(config.mongodbUri)
            .then(() => {
                console.log("Connected to MongoDB");
                resolve(true);
            })
            .catch((err) => {
                console.error("Error connecting to MongoDB", err);
                reject(false);
            });
    });
};

module.exports = connectDB;
