const Customer = require("../models/customerModels");
const { upload_on_cloud } = require('../utils/firebase');
const Otp = require("../models/otpModels")
const customerController = {};
const jwt = require("jsonwebtoken");
const generateOtp = require("../utils/generateOtp");
const config = require("../config/config");
const { sendMail } = require('../utils/sendOtpByEmail');
const Wishlist = require("../models/wishlistModels");
const Cart = require("../models/cartModels");
const Address = require("../models/addressModels");
const axios = require("axios");


customerController.signByPassword = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email && !password) {
            return res.status(404).json({
                status: false,
                message: "Please Provide All Details",
                missingFields: {
                    email: !email,
                    password: !password
                }
            });
        }
        const user = await Customer.findOne({ email })
            .populate("address", "savedAddresses")
            .populate({
                path: "orderHistory",
                model: "Order"
            });


        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
                data: {},
            });
        }
        if (!user.validPassword(password)) {
            return res.status(401).send({
                status: false,
                message: "Invalid credentials",
                data: {},
            });
        }

        const token = jwt.sign({ userId: user._id, phone: user.email }, config.jwtSecret, { expiresIn: "30d" });

        res.status(200).json({
            status: true,
            message: "Login successful",
            data: user,
            token
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }
};

customerController.signinByOtp = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(404).json({
                status: false,
                message: "Please Provide All Details",
                missingFields: {
                    email: !email
                }
            });
        }
        console.log(email);

        const user = await Customer.findOne({ email });
        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found",
                data: {},
            });
        }

        const otp = generateOtp();
        await Otp.deleteOne({ email, otp });

        // Send OTP
        // const otpSent = sendOtp(email, otp);
        if (!otp) return res.status(500).send({ error: "Failed to send OTP", status: false });

        const otpExpiresAt = new Date(Date.now() + 5 * 60000);
        const newOtp = new Otp({ email: email, otp, expiresAt: otpExpiresAt });
        await newOtp.save();

        await sendMail(email, "Email Verification Otp ", otp);

        return res.status(200).send({
            message: `OTP sent successfully`,
            otp: otp,
            status: true,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }
}

customerController.signup = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(404).json({
                status: false,
                message: "Please Provide All Details",
            });
        }
        const user = await Customer.findOne({ email });
        if (user) {
            return res.status(400).json({
                status: false,
                message: "User with given mail already exist"
            });
        }
        // const newUser = new Customer({ email });
        // await newUser.save();

        const otp = generateOtp();
        await Otp.deleteOne({ email, otp });

        // Send OTP
        // const otpSent = sendOtp(email, otp);
        if (!otp) return res.status(500).send({ error: "Failed to send OTP", status: false });

        // Save OTP in database
        const otpExpiresAt = new Date(Date.now() + 5 * 60000);
        const newOtp = new Otp({ email: email, otp, expiresAt: otpExpiresAt });
        await newOtp.save();

        // UnComment when UserName and Password are provided
        await sendMail(email, "Email Verification Otp ", otp);

        return res.status(200).send({
            message: `OTP sent successfully`,
            otp: otp,
            status: true,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }
};

customerController.verifyOtp = async (req, res) => {
    try {
        const { email, otp, password, phone, dob, name, type } = req.body;
        if (!email && !otp) {
            return res.status(404).json({
                status: false,
                message: "Please Provide Valid Email and Otp"
            });
        }
        // console.log(req.body);
        if (type == "signin") {
            if (!password && !name && !phone) {
                return res.status(404).json({
                    status: false,
                    message: "Please Provide All Details",
                    missingFields: {
                        name: !name,
                        password: !password,
                        phone: !phone
                    }
                });
            }
            const otpData = await Otp.findOne({ email, otp });

            if (!otpData) {
                return res.status(404).json({
                    status: false,
                    message: "Invalid OTP"
                });
            }
            if (otpData.expiresAt < new Date()) {
                await Otp.deleteOne({ email, otp });
                return res.status(400).send({
                    error: "OTP has expired",
                    status: false
                });
            }
            // OTP is valid and in time, delete it
            await Otp.deleteOne({ phone, otp });

            let profile_pic = "";
            const folderName = `Customers/${email}`;
            if (req.file) {
                const imgUrl = await upload_on_cloud(req.file, folderName);
                if (!imgUrl) return res.status(404).send({ status: false, message: "Image upload failed" });
                profile_pic = imgUrl;
            }

            const customerCount = await Customer.countDocuments();
            let customerId = `FBCUS${String(customerCount + 1).padStart(4, '0')}`;

            const userRecord = new Customer({
                customerId,
                email,
                password,
                phone,
                name,
                dob,
                profile_pic
            });

            if (password) {
                userRecord.password = userRecord.generateHash(password);
            }

            const user = await userRecord.save();

            if (user) {
                const address = new Address({ userId: user._id, savedAddresses: [] })
                const wishlist = new Wishlist({ userId: user._id, products: [] });
                const cart = new Cart({ userId: user._id, products: [] });
                await address.save();
                await wishlist.save();
                await cart.save();
                user.address = address._id;
                user.wishlist = wishlist._id;
                user.cart = cart._id;
                await user.save();
            }
            // Generate JWT token
            const token = jwt.sign({ userId: user._id, phone: user.email }, config.jwtSecret, { expiresIn: "30d" });

            return res.status(200).send({
                message: "OTP verified successfully",
                status: true,
                data: user,
                token
            });
        } else if (type == "login") {

            const user = await Customer.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: `User Not Find with email : ${email}`
                });
            }
            const otpData = await Otp.findOne({ email, otp });

            if (!otpData) {
                return res.status(404).json({
                    status: false,
                    message: "Invalid OTP"
                });
            }
            if (otpData.expiresAt < new Date()) {
                await Otp.deleteOne({ email, otp });
                return res.status(400).send({
                    error: "OTP has expired",
                    status: false
                });
            }
            // OTP is valid and in time, delete it
            await Otp.deleteOne({ email, otp });

            if (user.isDeleted) {
                return res.status(400).send({
                    message: "You are banned from using these Services",
                    status: false
                });
            }

            const token = jwt.sign({ userId: user._id, phone: user.phone }, config.jwtSecret, { expiresIn: "70d" });

            res.status(200).send({
                status: true,
                message: "OTP verified successfully",
                data: user,
                token
            });
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }

}

customerController.editCustomerById = async (req, res) => {
    try {
        // const { id } = req.params;
        const { name, dob } = req.body;
        const id = req.user._id;
        const user = await Customer.findById(id);
        // console.log(name);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }
        if (user.isDeleted) {
            return res.status(403).json({
                status: false,
                message: "Currently User does not have Access to update the Profile"
            });
        }

        let profile_pic = "";
        const folderName = `Customers/${user.email}`;
        if (req.file) {
            const imgUrl = await upload_on_cloud(req.file, folderName);
            if (!imgUrl) return res.status(404).send({ status: false, message: "Image upload failed" });
            profile_pic = imgUrl;
        }

        user.name = name || user.name;
        user.dob = dob || user.dob;
        user.profile_pic = profile_pic || user.profile_pic

        const updatedUser = await user.save();

        res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }
}

customerController.googleAuth = async (req, res) => {
    try {
        const { token } = req.body;
        // Add verification of Google OAuth token using axios request
        let googleRes;

        googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(error => {
            throw new Error('Failed to verify Google token: ' + error.message);
        });

        const { sub, email, name, picture } = googleRes.data;

        let user = await Customer.findOne({ email });


        if (!user) {
            // Create new user if not exists
            const customerCount = await Customer.countDocuments();
            let customerId = `FBCUS${String(customerCount + 1).padStart(4, '0')}`;
            user = new Customer({
                customerId,
                name,
                email,
                password: "google-auth",
                profile_pic: picture,
                googleID: sub,
            });

            const address = new Address({ userId: user._id, savedAddresses: [] })
            const wishlist = new Wishlist({ userId: user._id, products: [] });
            const cart = new Cart({ userId: user._id, products: [] });
            await address.save();
            await wishlist.save();
            await cart.save();
            user.address = address._id;
            user.wishlist = wishlist._id;
            user.cart = cart._id;
            await user.save();
        }

        // Generate JWT Token
        const authToken = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, { expiresIn: "30d" });

        return res.status(200).send({
            message: "Google Verification SuccessFul",
            status: true,
            data: user,
            token: authToken
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }
}

customerController.fbLogin = async (req, res) => {
    try {
        const { access_token } = req.body;

        const fbResponse = await axios.get(`https://graph.facebook.com/me`, {
            params: {
                fields: 'id,name,email,picture',
                access_token,
            },
        });

        const { id, name, email, picture } = fbResponse.data;

        if (!email) {
            return res.status(400).json({ message: 'Facebook account has no email associated.' });
        }

        let user = await Customer.findOne({ email });

        if (!user) {
            const customerCount = await Customer.countDocuments();
            let customerId = `FBCUS${String(customerCount + 1).padStart(4, '0')}`;
            user = await Customer.create({
                customerId,
                name,
                email,
                profile_pic: picture?.data?.url || '',
                password: 'google-auth',
            });

            const address = new Address({ userId: user._id, savedAddresses: [] });
            const wishlist = new Wishlist({ userId: user._id, products: [] });
            const cart = new Cart({ userId: user._id, products: [] });
            await address.save();
            await wishlist.save();
            await cart.save();
            user.address  = address._id;
            user.wishlist = wishlist._id;
            user.cart = cart._id;
            await user.save();
        }
        const authToken = jwt.sign({ userId: user._id, email: user.email }, config.jwtSecret, { expiresIn: "30d" });

        return res.status(200).send({
            message: "Google Verification SuccessFul",
            status: true,
            data: user,
            token: authToken
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: false,
            message: "Internal server error",
            meta: error
        });
    }
}


module.exports = customerController;