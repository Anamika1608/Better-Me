import { Schema, model } from 'mongoose';

const postSchema = new Schema({
    content: {
        type: String
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    pictures: {
        type: [String]
    },
    createdAt: {
        type: Date,
        default: new Date()
    }
});

const Product = model('Product', postSchema);

export default Product;
