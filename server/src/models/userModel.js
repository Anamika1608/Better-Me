import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    profilePicture: {
        type: String,
        required: true,
    },
    dob: {
        type: Date,
    },
    age: {
        type: Number,
        min: [1, 'Age must be greater than 0'],
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        // required: true
    },
    phoneNumber: {
        type: String,
        // required: true,
        // maxlength: 10
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        validate: {
            validator: function (v) {
                return v === null || /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`,
        }
    },
    twoFA: {
        type: Boolean,
        default: false
        // required : true
    },
    password: {
        type: String,
        minlength: 6,
    },
    profileName: {
        type: String,
        // required: true,
        trim: true,
    },
    attributes: {
        type: [{
            currentSelf: {
                type: [String], // Array of user behaviors for current self
                default: ["Unrelaxed", "Absent minded", "Afraid", "Exhausted"]
            },
            imagineSelf: {
                type: [String], // Array of user behaviors for imagined self
                default: ["Intelligent", "Wealthy", "Patient", "Social"]
            }
        }],
        default: [{}],  // Ensure default structure for both `currentSelf` and `imagineSelf`
    }
}, { timestamps: true });

// Middleware to hash the password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
