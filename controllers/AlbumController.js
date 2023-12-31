const mongoose = require('mongoose');
const AlbumModel = require('../models/album');
const UserModel = require('../models/user');

class AlbumController {
  // [GET] api/albums/all
  async getAll(req, res, next) {
    try {
      const data = await AlbumModel.findWithDeleted()
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .populate({
          path: 'artists',
          model: 'Artist',
        });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums?query=...
  async getQuery(req, res, next) {
    try {
      const query = Object.assign({}, req.query);
      const data = await AlbumModel.find(query)
        .populate('genres', 'name slug')
        .populate('artists', 'name slug');
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/album/list?ids=
  async getListByIds(req, res, next) {
    try {
      const ids = req.query.ids.split(',');
      const limit = parseInt(req.query.limit) || 10;

      const data = await AlbumModel.find({ _id: { $in: ids } })
        .populate('genres', 'name slug')
        .populate('artists', 'name slug imageUrl followers')
        // .sort({ _id: 1 })
        .limit(limit);

      console.log('ids', ids);
      console.log('data', data);
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums/genre/:id
  async getByGenreId(req, res, next) {
    try {
      const genreId = req.params.id;
      const data = await AlbumModel.find({ genres: { $in: [genreId] } })
        .populate('genres', 'name slug')
        .populate('artists', 'name slug');
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums/artist/:id?
  async getByArtistId(req, res, next) {
    try {
      const artistId = req.params.id;
      if (!artistId) {
        return res.status(404).json({ message: 'Artist ID is required' });
      }

      const limit = parseInt(req.query.limit) || 10;
      const sortField = req.query.sort || 'createdAt';
      const sortOrder = req.query.order === 'asc' ? 1 : -1;

      const sortObj = {};
      sortObj[sortField] = sortOrder;

      const data = await AlbumModel.find({ artists: { $in: [artistId] } })
        .populate('genres', 'name slug')
        .populate('artists', 'name slug imageUrl followers')
        .sort(sortObj)
        .limit(limit);

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums/artists/:ids
  async getByArtistIds(req, res, next) {
    try {
      const artistIds = req.query.ids.split(',');
      if (!artistIds) {
        return res.status(404).json({ message: 'Artist IDS is required' });
      }

      const limit = parseInt(req.query.limit) || 10;
      const sortField = req.query.sort || 'createdAt';
      const sortOrder = req.query.order === 'asc' ? 1 : -1;

      const sortObj = {};
      sortObj[sortField] = sortOrder;

      const artistObjectIds = artistIds.map((id) => new mongoose.Types.ObjectId(id));
      const data = await AlbumModel.find({ artists: { $in: artistObjectIds } })
        .populate('genres', 'name slug')
        .populate('artists', 'name slug imageUrl followers')
        .sort(sortObj)
        .limit(limit);

      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums/genres?ids=id,id,id
  async getByGenresIds(req, res, next) {
    try {
      const genreIds = req.query.ids.split(',');
      const genreObjectIds = genreIds.map((id) => new mongoose.Types.ObjectId(id));
      const data = await AlbumModel.find({ genres: { $in: genreObjectIds } })
        .populate('genres', 'name slug')
        .populate('artists', 'name slug');
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums/ (id or slug)
  async getByParam(req, res, next) {
    try {
      const param = req.params.param;
      let album;

      if (mongoose.Types.ObjectId.isValid(param)) {
        album = await AlbumModel.findById(param)
          .populate('genres', 'name slug')
          .populate('artists', 'name slug imageUrl followers');
      } else {
        album = await AlbumModel.findOne({ slug: param })
          .populate('genres', 'name slug')
          .populate('artists', 'name imageUrl slug followers');
      }

      if (!album) {
        return res.status(404).json({ message: 'Album not found' });
      }

      res.status(200).json(album);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [POST] api/albums/toggle-like
  async toggleLike(req, res, next) {
    try {
      const { albumId, userId } = req.body;
      if (!albumId) {
        return res.status(400).json({ message: 'Album ID not found' });
      }
      if (!userId) {
        return res.status(400).json({ message: 'User ID not found' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isLiked = user.favoriteAlbums.includes(albumId);

      const album = await AlbumModel.findById(albumId);
      if (!album) {
        return res.status(404).json({ message: 'album not found' });
      }

      if (isLiked) {
        user.favoriteAlbums = user.favoriteAlbums.filter((id) => id.toString() !== albumId);
        await user.save();

        if (album.favorites > 0) {
          album.favorites -= 1;
          await album.save();
        }

        return res.status(200).json({
          updatedUserFavorites: user.favoriteAlbums,
          updatedAlbumFavorites: song.favorites,
          message: 'Album unliked successfully',
          liked: false,
        });
      } else {
        user.favoriteAlbums.push(albumId);
        await user.save();

        album.favorites += 1;
        await album.save();

        return res.status(200).json({
          updatedUserFavorites: user.favoriteAlbums,
          updatedAlbumFavorites: album.favorites,
          message: 'Album liked successfully',
          liked: true,
        });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [POST] api/albums/store
  async create(req, res, next) {
    try {
      const data = new AlbumModel(req.body);
      const savedCategory = await data.save();
      res.status(200).json(savedCategory);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PUT] api/albums/update/:id
  async update(req, res, next) {
    try {
      const data = await AlbumModel.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true },
      );
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/albums/delete/:id
  async delete(req, res, next) {
    try {
      await AlbumModel.delete({ _id: req.params.id });
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/albums/delete-many
  async deleteMany(req, res, next) {
    const { ids } = req.body;
    try {
      await AlbumModel.delete({ _id: { $in: ids } });
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [GET] api/albums/trash
  async getTrash(req, res, next) {
    try {
      const data = await AlbumModel.findWithDeleted({
        deleted: true,
      });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [PATCH] api/albums/restore/:id
  async restore(req, res, next) {
    try {
      const data = await AlbumModel.restore({ _id: req.params.id });
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/albums/force/:id
  async forceDelete(req, res, next) {
    try {
      await AlbumModel.findByIdAndDelete(req.params.id);
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // [DELETE] api/albums/force-many
  async forceDeleteMany(req, res, next) {
    const { ids } = req.body;
    try {
      await AlbumModel.deleteMany({ _id: { $in: ids } });
      res.status(200).json('Deleted successfully');
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new AlbumController();
