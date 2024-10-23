import mongoose from "mongoose";

const masterclassSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    },
    tags : [
        {
            type: String
        }
    ],
    video : {
        type : String,
        required : true
    }
})

const Masterclass = mongoose.model('Masterclass', masterclassSchema);

export default Masterclass;