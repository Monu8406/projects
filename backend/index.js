
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require('multer');
const path = require('path');
const paymentRoutes = require("./routes/payment.js");

const cors = require('cors');
const dotenv = require('dotenv');
const crypto = require("crypto");
const Razorpay = require('razorpay'); 
  app.use(express.json());
  app.use(cors());
  const PORT = process.env.PORT || '4000'; 
  dotenv.config();
 //Database connection with moongo db;
 mongoose.connect("mongodb+srv://monutanti123:8406@cluster0.fspppq2.mongodb.net/e-commerce");
 
app.get("/", (req, res) => {
     res.send(" <h1> Expres App is Running </h1>");
 });
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
    return cb(null,`${file.filename}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });
 //Corrected the path to serve static images
 app.use('/images', express.static(path.join(__dirname, 'upload/images')));
// 
// 
const Product =  mongoose.model("Product",{

    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        reuired:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true
    },
    new_price:{
        type:String,
        required:true,
    },

    old_price:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
available:{
        type:Boolean,
        default:true
    }
});
// 
app.post('/upload', upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}`
    });
});

app.post("/addproduct", async (req, res) => {
    let products =    await Product.find({});
    let id;
    if(products.length>0)
    {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }
    else{
        id =1;
    }
    const product = new Product({
        id:id,
        name: req.body.name,
        image: req.body.image,
        category: req.body.category, // Fixed typo here
        new_price: req.body.new_price, // Fixed typo here
        old_price: req.body.old_price, // Fixed typo here
    });

    console.log(product);
    await product.save();
    console.log("saved");
    res.json({
        success: true,
        name: req.body.name,
    });
});
app.post('/removeproduct',async(req,res)=>{
  await Product.findOneAndDelete({id:req.body.id});
     console.log("Removed");
     res.json({
        success:true,
        name:req.body.name
     })
})

app.get("/allproducts",async(req, res)=>{
     let products =  await Product.find({});
     console.log("All Products Fetched");
     res.send(products);
})

const User = mongoose.model('User',{
    name:{
        type:String,
        },
        email:{
            type:String,
            unique:true,
        },
        password:{
            type:String,
        },
        cartData:{
            type:Object,
        },
        date:{
            type:Date,
            default:Date.now,
        }})

 app.post('/signup', async(req, res)=>{
    let check = await User.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing"})
    }
    let cart = {};
    for(let i =0;i<300;i++)
    {
        cart[i]=0;
    }

    const user  = new User({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cardData:cart,
    })
    await user.save();
    const data = {
        user:{
            id:user.id
        }
    }

//  //  

    const token = jwt.sign(data,'secret_ecom');
     res.json({success:true,token});
   })

   app.post('/login', async(req,res)=>{
    let user = await User.findOne({email:req.body.email});
    if(user){
        const passCompare =  req.body.password === user.password ;
        if(passCompare){
            const data ={
                user:{
                    id:user.id
                }
            }
// 
            const token =  jwt.sign(data,'secret_ecom');
            res.json({success : true,token});
         }
         else{
            res.json({success:false,errors:"Wrong Password"});
         }
    }
    else{
        res.json({success:false, errors:'Wrong Email Id'})
    }
   })

   app.get('/newcollections', async(req, res)=>{
     let  product =  await Product.find({});
      let newcollection = product.slice(1).slice(-8);
       console.log("NewCOllection");

  res.send(newcollection);
   })
  app.get('/popularinwomen',async(req,res)=>{
    let products =  await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("popular in women fetched");
    res.send(popular_in_women);
  })

     const fetchUser =  async(req, res)=>{
         const token =  req.header('auth-token');
         if(!token)
         {
            res.status(401).send({errors:"PLease authenticate using  valid"});
         }
         else{
            try{
               const data =  jwt.verify(token, '');
               req.user = data.user;
               next();
            }catch(error)
            {
           res.status(401).send({errors:"plese authenticate using value token"});
         }
         }
     }

 app.post('/addtocart',fetchUser,async(req,res)=>{
    console.log("Adeded", req.body.itemId);
    let userData =await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]+=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cardData:userData.cartData})
    res.send("Added")
 })
 
 app.post('/removefromcart',fetchUser,async(req, res)=>{
    console.log("Remove", req.body.itemId);
     let userData =  await Users.findOne({_id:req.user.id});
     if(   userData.cartData[req.body.itemId]>0)
     userData.cartData[req.body.itemId] +=1;
     await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData})
     res.send("Removed");
 })

 app.use("/api/payment/", paymentRoutes);
// 
 app.listen(PORT, (error) => {
     if (!error) {
        console.log("Server is running at port no " + PORT);
    } else {
        console.log("Error :" + error)
    }

});



