const mongoose = require("mongoose");

module.exports = async () => {
    try {
       
        await mongoose.connect(
           process.env.MONGO_CONN_STR,
        );
        console.log("Connected to database.");
    } catch (error) {
        console.log("Could not connect to database.", error);
    }
};
