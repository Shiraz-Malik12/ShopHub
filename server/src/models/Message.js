import mongoose from 'mongoose'
const messageSchema = new mongoose.Schema( {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true , trim: true, maxlength: 80 , lowercase: true},
    message: { type: String, required: true , trim: true, maxlength: 1000 },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    resolvedAt: { type: Date, default: null },
}, { timestamps: true })

 export default mongoose.model('Message', messageSchema)