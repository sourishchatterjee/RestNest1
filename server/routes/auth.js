const router =require("express").Router()
const bcrypt = require("bcryptjs")
const jwt =require("jsonwebtoken")
const multer = require("multer")
const User = require("../models/User")

/* Configuration Multer for File Upload */ 

const storage = multer.diskStorage(
    {
        destination: function (req,file,cb){
            cb(null, "public/uploads/")// Store uploaded file in the "uploads folder"
        },
        filename: function(req,file,cb){
            cb(null, file.originalname) //use the original file name
        }
    }
)

const upload =multer({storage})

/*USER REGISTER */

router.post("/register",upload.single("profileImage"), async (req,res) =>{
    try{
        /*Take all information from the form */
        const {firstName,lastName,email,password } = req.body
        /*The uploaded file is available as req.file */

        const profileImage =req.file

        if(!profileImage){
            return res.status(400).send("No file Upload")
        }
      /*PATH TO THE UPLOAD PROFILE PHOTO */
      const profileImagePath =profileImage.path

      /*CHECK IF USER EXISTS */
      const existingUser =await User.findOne({email})
      if(existingUser){
        return res.status(409).json({message: "User alreay exists!"})
      }

      /*hass the password */
      const  salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password,salt)

      /*CREATE A NEW USER */
      const newUser= new User({
        firstName,
        lastName,
        email,
        password:hashedPassword,
        profileImagePath,
      });

      /* save the new user */

      await newUser.save()

      /* send a successful message */
      res.status(200).json({message: "User registered successfully!",user:newUser})

    } catch (err){
        console.log(err)
        res.status(500).json({message: "Registeration failed!", error:err.message})
    }
})
/* USER LOGIN */
router.post("/login", async(req,res) =>{
    try{
        /* Take the information from the form */
        const {email,password} =req.body

        /* check if user exists */
        const user = await User.findOne({email});
        if(!user){
            return res.status(409).json({message: "user doesen't exisit!"});
        }

/*COMPARE THE PASSWORD  with the hashed password*/

const isMatch =await bcrypt.compare(password,user.password)
if (!isMatch){
    return res.status(400).json({message: "Invalid Credentials!"})
}
/*GENERATING JWT TOKEN */
const token = jwt.sign({id: user._id},process.env.JWT_SECRET)
delete user.password

res.status(200).json({token, user})


    }catch (err){
        console.log(err)
        res.status(500).json({error:err.message})
    }
})

module.exports = router