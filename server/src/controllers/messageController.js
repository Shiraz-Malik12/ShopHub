import Message from "../models/Message.js";
import { sendEmail } from '../utils/sendEmail.js'
import { sendInBackground } from '../utils/orderEmails.js'

export async function createMessage(req, res, next) {
    try {
        const { name, email, message } = req.body;
        const newMessage = new Message({ name, email, message });
        const savedMessage = await newMessage.save();
        res.status(201).json({ message: 'Message created', data: savedMessage });
    } catch (err) {
        next(err);
    }
}

export async function getAllMessages(req, res, next) {
    try {
        const messages = await Message.find().sort({ createdAt: -1 , _id: -1  });
        res.status(200).json({ message: 'Messages retrieved', data: messages });
    } catch (err) {
        next(err);
    }
}


// PATCH /api/admin/messages/:id/resolve
export async function resolveMessage(req, res, next) {
  try {
    // 1. find
    const contact = await Message.findById(req.params.id)

    // 2. not found? stop here
    if (!contact) return res.status(404).json({ message: 'Message not found' })

    // 3. change
    if(contact.status === 'resolved') {
      return res.status(409).json({ message: 'Message is already resolved' })
    }
    contact.status = 'resolved'
    contact.resolvedAt = new Date()

    // 4. save to the database
    await contact.save()

    // 5. email the customer (in the background)
    sendInBackground(
      sendEmail({
        to: contact.email,
        subject: 'Your ShopHub message has been resolved',
        text: `Hi ${contact.name}, your problem has been solved. Thank you for contacting ShopHub!`,
      }),
    )

    // 6. answer the admin
    res.status(200).json({ message: 'Message resolved', data: contact })
  } catch (err) {
    next(err)
  }
}