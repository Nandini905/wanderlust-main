const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  thread: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MessageThread',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'booking_request', 'booking_confirmed', 'booking_cancelled'],
    default: 'text'
  },
  metadata: {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing'
    }
  }
}, {
  timestamps: true
});

const messageThreadSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ thread: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ recipient: 1 });
messageThreadSchema.index({ participants: 1 });
messageThreadSchema.index({ lastMessageAt: -1 });

// Virtual for message preview
messageSchema.virtual('preview').get(function() {
  return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content;
});

// Update thread's last message when a new message is created
messageSchema.post('save', async function() {
  await MessageThread.findByIdAndUpdate(this.thread, {
    lastMessage: this._id,
    lastMessageAt: this.createdAt
  });
});

// Mark message as read
messageSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);
const MessageThread = mongoose.model('MessageThread', messageThreadSchema);

module.exports = { Message, MessageThread };
