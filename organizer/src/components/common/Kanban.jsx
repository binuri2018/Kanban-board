import { Box, Button, Typography, Divider, TextField, IconButton, Card, Chip } from '@mui/material';
import { useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import sectionApi from '../../api/sectionApi';
import taskApi from '../../api/taskApi';
import TaskModal from './TaskModal';
import Moment from 'moment';

let timer;
const timeout = 500;

const Kanban = (props) => {
  const { boardId, showClosingDate } = props;
  const [data, setData] = useState([]);
  const [selectedTask, setSelectedTask] = useState(undefined);

  useEffect(() => {
    setData(props.data);
  }, [props.data]);

  const onDragEnd = async ({ source, destination }) => {
    if (!destination) return;

    const sourceColIndex = data.findIndex(e => e._id === source.droppableId);
    const destinationColIndex = data.findIndex(e => e._id === destination.droppableId);

    if (sourceColIndex === -1 || destinationColIndex === -1) {
      console.error('Invalid droppableId:', source.droppableId, destination.droppableId);
      return;
    }

    const sourceCol = data[sourceColIndex];
    const destinationCol = data[destinationColIndex];

    const sourceTasks = [...sourceCol.tasks];
    const destinationTasks = [...destinationCol.tasks];

    if (source.droppableId !== destination.droppableId) {
      const [removed] = sourceTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, removed);
      data[sourceColIndex].tasks = sourceTasks;
      data[destinationColIndex].tasks = destinationTasks;
    } else {
      const [removed] = destinationTasks.splice(source.index, 1);
      destinationTasks.splice(destination.index, 0, removed);
      data[destinationColIndex].tasks = destinationTasks;
    }

    setData([...data]);

    try {
      await taskApi.updatePosition(boardId, {
        resourceList: sourceTasks,
        destinationList: destinationTasks,
        resourceSectionId: sourceCol._id,
        destinationSectionId: destinationCol._id
      });
    } catch (err) {
      console.error('Error updating task position:', err);
      alert('Failed to update task position.');
    }
  };

  const createSection = async () => {
    try {
      const section = await sectionApi.create(boardId);
      setData([...data, section]);
    } catch (err) {
      console.error('Error creating section:', err);
      alert('Failed to create section.');
    }
  };

  const deleteSection = async (sectionId) => {
    try {
      await sectionApi.delete(boardId, sectionId);
      setData(data.filter(e => e._id !== sectionId));
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Failed to delete section.');
    }
  };

  const updateSectionTitle = async (e, sectionId) => {
    clearTimeout(timer);
    const newTitle = e.target.value;
    const updatedData = data.map(section => 
      section._id === sectionId ? { ...section, title: newTitle } : section
    );
    setData(updatedData);

    timer = setTimeout(async () => {
      try {
        await sectionApi.update(boardId, sectionId, { title: newTitle });
      } catch (err) {
        console.error('Error updating section title:', err);
        alert('Failed to update section title.');
      }
    }, timeout);
  };

  const createTask = async (sectionId) => {
    try {
      const task = await taskApi.create(boardId, { sectionId });
      const updatedData = data.map(section =>
        section._id === sectionId ? { ...section, tasks: [task, ...section.tasks] } : section
      );
      setData(updatedData);
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task.');
    }
  };

  const onUpdateTask = (task) => {
    const updatedData = data.map(section => ({
      ...section,
      tasks: section.tasks.map(t => t._id === task._id ? task : t)
    }));
    setData(updatedData);
  };

  const onDeleteTask = (task) => {
    const updatedData = data.map(section => ({
      ...section,
      tasks: section.tasks.filter(t => t._id !== task._id)
    }));
    setData(updatedData);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button onClick={createSection}>
          Add Organizers
        </Button>
        <Typography variant='body2' fontWeight='700'>
          {data.length} Organizers
        </Typography>
      </Box>
      <Divider sx={{ margin: '10px 0' }} />
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', width: 'calc(100vw - 400px)', overflowX: 'auto' }}>
          {data.map(section => (
            <div key={section._id} style={{ width: '300px' }}>
              <Droppable key={section._id} droppableId={section._id}>
                {(provided) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{ width: '300px', padding: '10px', marginRight: '10px' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <TextField
                        value={section.title}
                        onChange={(e) => updateSectionTitle(e, section._id)}
                        placeholder='Untitled'
                        variant='outlined'
                        sx={{ flexGrow: 1, '& .MuiOutlinedInput-input': { padding: 0 }, '& .MuiOutlinedInput-notchedOutline': { border: 'unset ' }, '& .MuiOutlinedInput-root': { fontSize: '1rem', fontWeight: '700' } }}
                      />
                      <IconButton
                        variant='outlined'
                        size='small'
                        sx={{ color: 'gray', '&:hover': { color: 'green' } }}
                        onClick={() => createTask(section._id)}
                      >
                        <AddOutlinedIcon />
                      </IconButton>
                      <IconButton
                        variant='outlined'
                        size='small'
                        sx={{ color: 'gray', '&:hover': { color: 'red' } }}
                        onClick={() => deleteSection(section._id)}
                      >
                        <DeleteOutlinedIcon />
                      </IconButton>
                    </Box>
                    {section.tasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{ padding: '10px', marginBottom: '10px', cursor: snapshot.isDragging ? 'grab' : 'pointer!important' }}
                            onClick={() => setSelectedTask(task)}
                          >
                            <Typography>
                              {task.title === '' ? 'Untitled' : task.title}
                            </Typography>
                            {showClosingDate && task.closingDate && (
                              <Chip
                                label={`Due: ${Moment(task.closingDate).format('MMM D, YYYY')}`}
                                icon={<AccessTimeIcon />}
                                sx={{ marginTop: '10px' }}
                              />
                            )}
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </div>
          ))}
        </Box>
      </DragDropContext>
      <TaskModal
        task={selectedTask}
        boardId={boardId}
        onClose={() => setSelectedTask(undefined)}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
      />
    </>
  );
};

export default Kanban;
