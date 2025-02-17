const User = require("../models/UserModels");
const config = require('../config/config')
const Customer = require("../models/customerModels");
const { upload_on_cloud } = require('../utils/firebase');

const adminController = {};

adminController.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const isDeleted = req.query.isDeleted || false;

        const skip = (page - 1) * limit;
        let users = null;
        let totalUsers;
        if (isDeleted) {
            users = await Customer.find({ isDeleted: true }).skip(skip).limit(limit);
            totalUsers = await Customer.countDocuments({ isDeleted: true });
        } else {
            users = await Customer.find({ isDeleted: false }).skip(skip).limit(limit);
            totalUsers = await Customer.countDocuments({ isDeleted: false });
        }
        const totalPages = Math.ceil(totalUsers / limit);
        // console.log(isDeleted);

        res.status(200).json({
            status: true,
            message: `${isDeleted ? "Deleted Users fetched successfully" : "Users fetched successfully"}`,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers,
            userPerPage: limit,
            data: users,
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

adminController.getAllAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const isDeleted = req.query.isDeleted || false;

        const skip = (page - 1) * limit;
        let users = null;
        let totalUsers;
        if (isDeleted == "true") {
            users = await User.find({ isDeleted: true, role: { $ne: "superadmin" } }).skip(skip).limit(limit);
            totalUsers = await Customer.countDocuments({ isDeleted: true, role: { $ne: "superadmin" } });
        } else {
            users = await User.find({ isDeleted: false, role: { $ne: "superadmin" } }).skip(skip).limit(limit);
            totalUsers = await User.countDocuments({ isDeleted: false, role: { $ne: "superadmin" } });
        }
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            status: true,
            message: `${isDeleted ? "Deleted Admins fetched successfully" : "Admins fetched successfully"} `,
            currentPage: page,
            totalPages: totalPages,
            totalUsers: totalUsers,
            userPerPage: limit,
            data: users,
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

adminController.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await Customer.findById({ _id: id });

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }
        user.isDeleted = true;
        await user.save();
        res.status(200).json({
            status: true,
            message: "User deleted successfully",
            data: user
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

adminController.deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "Admin not found"
            });
        }
        user.isDeleted = true;
        await user.save();
        res.status(200).json({
            status: true,
            message: "Admin deleted successfully",
            data: user
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

module.exports = adminController;