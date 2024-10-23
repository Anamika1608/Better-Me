import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    pictures : {
        type : [String],
        required:true
    },
    title : {
        type : String,
        required : true
    },
    shortDescription : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    inStock : {
        type : Boolean ,
        required : true
    },
    product_id : {
        type : String,
        required : true
    },
    category : {
        type : String,
        required : true
    }
})

const Product = mongoose.model('Product', productSchema);

export default Product