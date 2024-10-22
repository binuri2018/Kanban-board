const Task = require('../models/task')
const Section = require('../models/section')

exports.create = async (req, res) => {
  const { sectionId, closingDate } = req.body
  console.error('Section ID is missing');
  console.log('Creating task with sectionId:', sectionId);

  
  if (!sectionId) {
    return res.status(400).json({ message: 'Section ID is required' });
  }

  try {
    const section = await Section.findById(sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const tasksCount = await Task.countDocuments({ section: sectionId }); // Changed from count() to countDocuments()
    const task = await Task.create({
      section: sectionId,
      position: tasksCount > 0 ? tasksCount : 0,
      closingDate 
    });
    task._doc.section = section;
    res.status(201).json(task);
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

exports.update = async (req, res) => {
  const { taskId } = req.params
  const { closingDate } = req.body
  try {
    const task = await Task.findByIdAndUpdate(
      taskId,
      { $set: req.body },
      { new: true } 
    )
    res.status(200).json(task)
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

exports.delete = async (req, res) => {
  const { taskId } = req.params
  try {
    const currentTask = await Task.findById(taskId)
    await Task.deleteOne({ _id: taskId })
    const tasks = await Task.find({ section: currentTask.section }).sort('position')
    for (const key in tasks) {
      await Task.findByIdAndUpdate(
        tasks[key]._id,
        { $set: { position: key } }
      )
    }
    res.status(200).json('deleted')
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

exports.updatePosition = async (req, res) => {
  const {
    resourceList,
    destinationList,
    resourceSectionId,
    destinationSectionId
  } = req.body
  const resourceListReverse = resourceList.reverse()
  const destinationListReverse = destinationList.reverse()
  try {
    if (resourceSectionId !== destinationSectionId) {
      for (const key in resourceListReverse) {
        await Task.findByIdAndUpdate(
          resourceListReverse[key]._id,
          {
            $set: {
              section: resourceSectionId,
              position: key
            }
          }
        )
      }
    }
    for (const key in destinationListReverse) {
      await Task.findByIdAndUpdate(
        destinationListReverse[key]._id,
        {
          $set: {
            section: destinationSectionId,
            position: key
          }
        }
      )
    }
    res.status(200).json('updated')
  } catch (err) {
    console.error(err); // Log error for debugging
    res.status(500).json({ message: "Server error", error: err.message });
  }
}