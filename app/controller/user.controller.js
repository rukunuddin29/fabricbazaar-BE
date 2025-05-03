const User = require("../models/UserModels");
const config = require('../config/config')
const userController = {};
const jwt = require("jsonwebtoken");
const { sendMail } = require("../utils/sendOtpByEmail");

userController.login = async (req, res) => {
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
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found" });
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
        res.status(500).json({ status: false, message: "Internal server error", meta: error });
    }
};

userController.register = async (req, res) => {
    const { name, email, password, role, access } = req.body;
    try {
        if (!email && !password && !role) {
            return res.status(404).json({
                status: false,
                message: "Please Provide All Details",
                missingFields: {
                    email: !email,
                    password: !password,
                    role: !role
                }
            });
        }
        const user = await User.findOne({ email });

        let accessArr = [];

        if (role === "admin") {
            if (!access) {
                return res.status(400).json({
                    status: false,
                    message: "Please Provide Access Details"
                });
            }
            // check if access is array or not and convert if not
            if (!Array.isArray(access)) {
                access = [access];
            }
            // check if access is valid or not
            const validAccess = ["payment", "orders", "customer", "products"];
            if (access.some((item) => !validAccess.includes(item))) {
                return res.status(400).json({
                    status: false,
                    message: "Invalid Access"
                });
            }
            accessArr = access;
        }
        if (user) {
            return res.status(400).json({
                status: false,
                message: "User with given mail already exist"
            });
        }
        // if(user.)
        const newUser = new User({ name, email, password, role, access: accessArr });
        if (password) {
            newUser.password = newUser.generateHash(password);
        }
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, phone: newUser.email }, config.jwtSecret, { expiresIn: "30d" });

        res.status(201).json({
            status: true,
            message: "New Admin is Created Succesfully",
            data: newUser,
            token
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

module.exports = userController;