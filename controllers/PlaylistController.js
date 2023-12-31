const mongoose = require('mongoose');
const PlaylistModel = require('../models/playlist');
const SongModel = require('../models/song');

class PlaylistController {
  // [GET] api/playlists/all
  async getAll(req, res, next) {
    try {
      const data = await PlaylistModel.findWithDeleted();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  // [GET] api/playlists
  async getQuery(req, res, next) {
    try {
      const query = Object.assign({}, req.query);
      const data = await PlaylistModel.find(query);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/playlists/:id
  async getByParam(req, res, next) {
    try {
      const param = req.params.param;
      let playlist;

      if (mongoose.Types.ObjectId.isValid(param)) {
        playlist = await PlaylistModel.findById(param)
          .populate('userId', 'fullName')
          .populate({
            path: 'tracks',
            populate: {
              path: 'artists composers albumId',
            },
          });
      } else {
        playlist = await PlaylistModel.findOne({ slug: param })
          .populate('userId', 'fullName')
          .populate({
            path: 'tracks',
            populate: {
              path: 'artists composers albumId',
            },
          });
      }

      if (!playlist) {
        return res.status(404).json({ message: 'Playlist not found' });
      }

      res.status(200).json(playlist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/playlist/list?ids=
  async getListByIds(req, res, next) {
    try {
      const ids = req.query.ids.split(',');
      const limit = parseInt(req.query.limit) || 10;

      const data = await PlaylistModel.find({ _id: { $in: ids } }).limit(limit);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // /playlists/add-songs/:playlistId
  async addSongsToPlaylist(req, res) {
    const playlistId = req.params.playlistId;
    const songIds = req.body.songIds;

    try {
      const playlist = await PlaylistModel.findById(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist is required.' });
      }

      const songList = [];
      for (const songId of songIds) {
        const song = await SongModel.findById(songId);
        if (!song) {
          return res.status(404).json({ message: 'Song not found.' });
        }
        songList.push(song);
        playlist.tracks.addToSet(songId);
      }

      await playlist.save();

      return res.status(200).json(songList);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // /playlists/remove-songs/:playlistId
  async removeSongsFromPlaylist(req, res) {
    const playlistId = req.params.playlistId;
    const songIds = req.body.songIds;

    try {
      const playlist = await PlaylistModel.findById(playlistId);
      if (!playlist) {
        return res.status(404).json({ message: 'Playlist is required.' });
      }

      for (const songId of songIds) {
        const songIndex = playlist.tracks.indexOf(songId);
        if (songIndex !== -1) {
          playlist.tracks.splice(songIndex, 1);
        }
      }

      await playlist.save();

      return res.status(200).json(playlist.tracks);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // [POST] api/playlists/store
  async create(req, res, next) {
    try {
      const data = new PlaylistModel(req.body);
      const savedCategory = await data.save();
      res.status(200).json(savedCategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PUT] api/playlists/update/:id
  async update(req, res, next) {
    try {
      const data = await PlaylistModel.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true },
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/playlists/delete/:id
  async delete(req, res, next) {
    try {
      await PlaylistModel.delete({ _id: req.params.id });
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/playlists/delete-many
  async deleteMany(req, res, next) {
    const { ids } = req.body;
    try {
      await PlaylistModel.delete({ _id: { $in: ids } });
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/playlists/trash
  async getTrash(req, res, next) {
    try {
      const data = await PlaylistModel.findWithDeleted({
        deleted: true,
      });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PATCH] api/playlists/restore/:id
  async restore(req, res, next) {
    try {
      const data = await PlaylistModel.restore({ _id: req.params.id });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/playlists/force/:id
  async forceDelete(req, res, next) {
    try {
      await PlaylistModel.findByIdAndDelete(req.params.id);
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/playlist/force-many
  async forceDeleteMany(req, res, next) {
    const { ids } = req.body;
    try {
      await PlaylistModel.deleteMany({ _id: { $in: ids } });
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new PlaylistController();
