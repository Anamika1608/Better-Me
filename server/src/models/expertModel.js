import mongoose from 'mongoose';

const expertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'user',
        required: true
    },
    masterclasses: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'masterclass'
        }
    ],
    expertTag: [
        {
            type: String
        }
    ]
}, { timestamps: true });


const Expert = mongoose.model('Expert', expertSchema);

export default Expert;
