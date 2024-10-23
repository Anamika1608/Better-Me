import mongoose from 'mongoose';

const pendingUserSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        // required: true
    },
    email : {
        type : String,
        
    },
    password: {
        type: String,
        minlength: 6,
        // required: true,
    },
    filepath : {
        type: String,
        // required: true,
    },
    otp : {
        type : Number
    },
    otpExpiration : {
        type : Date
    }

}, { timestamps: true });


const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

export default PendingUser;
