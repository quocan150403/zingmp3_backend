const mongoose = require('mongoose');
const mongooseDelete = require('mongoose-delete');

const User = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, default: 'user' },
    fullName: { type: String, required: true },
    imageUrl: { type: String, required: true },
    UID: { type: String, required: true },

    favoriteAlbums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    favoriteSongs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    favoriteArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    history: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
    historyAlbums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
    historyArtists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artist' }],
    historySearches: [{ type: String }],
    status: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

User.plugin(mongooseDelete, { overrideMethods: 'all', deletedAt: true });

module.exports = mongoose.model('User', User);
