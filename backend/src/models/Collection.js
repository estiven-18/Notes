import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

collectionSchema.index({ updatedAt: -1 });

collectionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

collectionSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;