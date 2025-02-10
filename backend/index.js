const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const compression = require('compression');
require('dotenv').config();
const bodyParser= require('body-parser')
const productRoutes = require("./routes/productRoutes");
const paymentRoutes = require('./routes/paymentRoutes');
const Product = require("./models/productData"); // Import your Mongoose model
const { urlencoded } = require('body-parser');

const app = express();


const PORT = process.env.PORT || 3040;
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect("mongodb://localhost:27017/pdatadexter")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));



    
app.use('/api/payment', paymentRoutes);
app.use("/api/products", productRoutes);




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
