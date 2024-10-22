const Board = require('../models/board');
const Section = require('../models/section');
const Task = require('../models/task');
const mongoose = require('mongoose');  // Import mongoose to validate ObjectIds

exports.create = async (req, res) => {
  try {
    const boardsCount = await Board.countDocuments();
    const board = await Board.create({
      user: req.user._id,
      position: boardsCount > 0 ? boardsCount : 0
    });
    
    // Send 'id' along with the '_id' for consistency in the frontend
    res.status(201).json({
      ...board._doc, // Send the board object data
      id: board._id  // Explicitly include 'id' as an alias for '_id'
    });
  } catch (err) {
    console.error('Error in Board Create:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to create board', error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const boards = await Board.find({ user: req.user._id }).sort('-position');
    res.status(200).json(boards);
  } catch (err) {
    console.error('Error fetching all boards:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to fetch boards', error: err.message });
  }
};

exports.updatePosition = async (req, res) => {
  const { boards } = req.body;
  try {
    if (boards && boards.length > 0) {
      for (let i = 0; i < boards.length; i++) {
        const board = boards[i];
        if (board && board._id) {
          await Board.findByIdAndUpdate(board._id, { $set: { position: i } });
        }
      }
    } else {
      return res.status(400).json({ message: "No boards provided" });
    }
    res.status(200).json('Position updated');
  } catch (err) {
    console.error('Error updating board positions:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to update positions', error: err.message });
  }
};

exports.getOne = async (req, res) => {
  const { boardId } = req.params;

  // Validate boardId
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: 'Invalid board ID format' });
  }

  try {
    const board = await Board.findOne({ user: req.user._id, _id: boardId });
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const sections = await Section.find({ board: boardId });
    for (const section of sections) {
      const tasks = await Task.find({ section: section._id }).populate('section').sort('-position');
      section._doc.tasks = tasks;
    }
    board._doc.sections = sections;
    res.status(200).json(board);
  } catch (err) {
    console.error('Error fetching single board:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to fetch board', error: err.message });
  }
};

exports.update = async (req, res) => {
  const { boardId } = req.params;
  const { title, description, favourite } = req.body;

  // Validate boardId
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: 'Invalid board ID format' });
  }

  try {
    if (!title) req.body.title = 'Untitled';
    if (!description) req.body.description = 'Add description here';

    const currentBoard = await Board.findById(boardId);
    if (!currentBoard) return res.status(404).json({ message: 'Board not found' });

    if (favourite !== undefined && currentBoard.favourite !== favourite) {
      const favourites = await Board.find({
        user: currentBoard.user,
        favourite: true,
        _id: { $ne: boardId }
      }).sort('favouritePosition');

      if (favourite) {
        req.body.favouritePosition = favourites.length > 0 ? favourites.length : 0;
      } else {
        for (let i = 0; i < favourites.length; i++) {
          const element = favourites[i];
          await Board.findByIdAndUpdate(element._id, { $set: { favouritePosition: i } });
        }
      }
    }

    const board = await Board.findByIdAndUpdate(boardId, { $set: req.body }, { new: true });
    res.status(200).json(board);
  } catch (err) {
    console.error('Error updating board:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to update board', error: err.message });
  }
};

exports.getFavourites = async (req, res) => {
  try {
    const favourites = await Board.find({
      user: req.user._id,
      favourite: true
    }).sort('-favouritePosition');
    res.status(200).json(favourites);
  } catch (err) {
    console.error('Error fetching favourites:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to fetch favourites', error: err.message });
  }
};

exports.updateFavouritePosition = async (req, res) => {
  const { boards } = req.body;
  try {
    if (boards && boards.length > 0) {
      for (let i = 0; i < boards.length; i++) {
        const board = boards[i];
        if (board && board._id) {
          await Board.findByIdAndUpdate(board._id, { $set: { favouritePosition: i } });
        }
      }
    } else {
      return res.status(400).json({ message: "No boards provided" });
    }
    res.status(200).json('Favourite positions updated');
  } catch (err) {
    console.error('Error updating favourite positions:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to update favourites', error: err.message });
  }
};

exports.delete = async (req, res) => {
  const { boardId } = req.params;

  // Validate boardId
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: 'Invalid board ID format' });
  }

  try {
    const sections = await Section.find({ board: boardId });
    for (const section of sections) {
      await Task.deleteMany({ section: section._id });
    }
    await Section.deleteMany({ board: boardId });

    const currentBoard = await Board.findById(boardId);

    if (currentBoard && currentBoard.favourite) {
      const favourites = await Board.find({
        user: currentBoard.user,
        favourite: true,
        _id: { $ne: boardId }
      }).sort('favouritePosition');

      for (let i = 0; i < favourites.length; i++) {
        const element = favourites[i];
        await Board.findByIdAndUpdate(element._id, { $set: { favouritePosition: i } });
      }
    }

    await Board.deleteOne({ _id: boardId });

    const boards = await Board.find().sort('position');
    for (let i = 0; i < boards.length; i++) {
      const board = boards[i];
      await Board.findByIdAndUpdate(board._id, { $set: { position: i } });
    }

    res.status(200).json('Board deleted successfully');
  } catch (err) {
    console.error('Error deleting board:', err);  // Improved error logging
    res.status(500).json({ message: 'Failed to delete board', error: err.message });
  }
};
