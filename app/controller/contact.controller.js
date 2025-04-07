const User = require("../models/UserModels");
const config = require('../config/config')
const Contact = require("../models/contactModels");
const { upload_on_cloud } = require('../utils/firebase');

const contactController = {};

contactController.getAllDetails = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || "";
        const status = req.query.status || "";

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { contactDetails: { $regex: search, $options: 'i' } }
            ]
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        let users = null;
        let totalUsers;

        users = await Contact.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        totalUsers = await Contact.countDocuments(query);

        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            status: true,
            message: "All Contact Form fetched successfully",
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

contactController.submitForm = async (req, res) => {
    try {
        const { name, contactDetails, message } = req.body;

        const contact = new Contact({
            name,
            contactDetails,
            message
        });

        const ContactForm = await contact.save();
        res.status(200).json({
            status: true,
            message: "Contact Form is Submitted Successfully",
            data: ContactForm
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

module.exports = contactController;