const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const path= require('path');
const compression = require('compression');
require('dotenv').config();
const bodyParser= require('body-parser')
const productRoutes = require("./routes/productRoutes");
 
const Product = require("./models/productData"); 
const { urlencoded } = require('body-parser');

const app = express();
app.use(express.static(path.join(__dirname, '../frontend/build')));

const MONGO_URL = process.env.MONGO_URL;


const PORT = process.env.PORT || 3046;
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(compression());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

  

    
 
app.use("/api/products", productRoutes);
app.use("/health", async (req,res)=>{
    
  console.log("Jag raha hu!");
  res.status(200).json({message : "Jag raha hu!"});
 
})
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
