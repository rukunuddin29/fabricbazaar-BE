const Address = require("../models/addressModels");
const Customer = require("../models/customerModels");

const addressControllers = {};

// Get all saved addresses
addressControllers.getAll = async (req, res) => {
    try {
        const _id = req.user._id;
        const addresses = await Address.findOne({ userId: _id });
        if (!addresses) {
            return res.status(202).send({ status: true, message: "User Address are fetched", data: [] });
        }
        return res.status(200).send({ status: true, message: "User Address are fetched", data: addresses.savedAddresses });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Add new address
addressControllers.add = async (req, res) => {
    try {
        const _id = req.user._id;
        const { state, city, pinCode, address, alternativePhoneNumber } = req.body;

        let userAddresses = await Address.findOne({ userId: _id });
        const user = await Customer.findById(_id);

        const newAddress = {
            state,
            address,
            city,
            pinCode,
            alternativePhoneNumber,
            selected: !userAddresses || userAddresses.savedAddresses.length === 0,
        };

        if (userAddresses) {
            userAddresses.savedAddresses.push(newAddress);
            await userAddresses.save();
        } else {
            userAddresses = await Address.create({
                userId: _id,
                savedAddresses: [newAddress],
            });
        }

        const addedAddress = userAddresses.savedAddresses[userAddresses.savedAddresses.length - 1];

        // user.addresses.push(addedAddress._id);
        // await user.save();

        return res.status(200).send({ status: true, msg: "Address added successfully.", data: addedAddress });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Delete address
addressControllers.delete = async (req, res) => {
    try {
        const { addressId } = req.params;
        const address = await Address.findById(req.user.address)

        const addressIndexInCustomer = address.savedAddresses.findIndex((addr) => addr._id.toString() === addressId);
        if (addressIndexInCustomer !== -1) {
            address.savedAddresses.splice(addressIndexInCustomer, 1);
            await address.save();
        } else {
            return res.status(404).send({ status: false, msg: "Address not found." });
        }

        return res.status(200).send({ status: true, msg: "Address deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Set selected address
addressControllers.setSelectedAddress = async (req, res) => {
    try {
        const { addressId } = req.params;
        const userAddresses = await Address.findById(req.user.address);

        if (!userAddresses) {
            return res.status(404).send({ status: false, msg: "No addresses found." });
        }

        let selectedAddress;
        // Unselect the currently selected address and select the new one
        userAddresses.savedAddresses.forEach((address) => {
            if (address._id.toString() === addressId) {
                address.selected = true;
                selectedAddress = address;
            } else {
                address.selected = false;
            }
        });

        await userAddresses.save();

        return res.status(200).send({ status: true, msg: "Selected address set successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

// Edit address
addressControllers.edit = async (req, res) => {
    try {
        const { addressId } = req.params;
        const _id = req.user._id;
        const { state, city, pinCode, address, alternativePhoneNumber } = req.body;

        const userAddresses = await Address.findOne({ userId: _id });

        if (!userAddresses) {
            return res.status(404).send({ status: false, msg: "No addresses found." });
        }

        const addressToEdit = userAddresses.savedAddresses.find((addr) => addr._id.toString() === addressId);
        if (!addressToEdit) {
            return res.status(404).send({ status: false, msg: "Address not found." });
        }

        // Update the address fields
        addressToEdit.state = state;
        addressToEdit.city = city;
        addressToEdit.pinCode = pinCode;
        addressToEdit.address = address;
        addressToEdit.alternativePhoneNumber = alternativePhoneNumber;

        await userAddresses.save();

        return res.status(200).send({ status: true, msg: "Address edited successfully.", data: addressToEdit });
    } catch (error) {
        console.error(error);
        res.status(500).send({ status: false, msg: error.message });
    }
};

module.exports = addressControllers;
