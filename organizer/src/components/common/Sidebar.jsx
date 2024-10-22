import { useSelector, useDispatch } from 'react-redux'
import { Box, Drawer, IconButton, List, ListItem, ListItemButton, Typography, TextField } from '@mui/material'
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined'
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined'
import { Link, useNavigate, useParams } from 'react-router-dom'
import assets from '../../assets/index'
import { useEffect, useState } from 'react'
import boardApi from '../../api/boardApi'
import { setBoards } from '../../redux/features/boardSlice'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'
import FavouriteList from './FavouriteList'

const Sidebar = () => {
  const user = useSelector((state) => state.user.value)
  const boards = useSelector((state) => state.board.value) || [] 
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { boardId } = useParams()
  const [activeIndex, setActiveIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const sidebarWidth = 250

  useEffect(() => {
    const getBoards = async () => {
      try {
        const res = await boardApi.getAll()
        console.log('Fetched boards:', res) 
        dispatch(setBoards(res))
      } catch (err) {
        console.error('Error fetching boards:', err) 
        alert(err)
      }
    }
    getBoards()
  }, [dispatch])

  useEffect(() => {
    if (Array.isArray(boards)) {
      const activeItem = boards.findIndex(e => e?._id === boardId)
      if (boards.length > 0 && !boardId) {
        navigate(`/boards/${boards[0]._id}`)
      }
      setActiveIndex(activeItem >= 0 ? activeItem : 0)
    }
  }, [boards, boardId, navigate])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const onDragEnd = async ({ source, destination }) => {
    if (!destination) return; 
    const newList = [...boards]
    const [removed] = newList.splice(source.index, 1)
    newList.splice(destination.index, 0, removed)

    const activeItem = newList.findIndex(e => e?._id === boardId)
    setActiveIndex(activeItem >= 0 ? activeItem : 0)
    dispatch(setBoards(newList))

    try {
      await boardApi.updatePosition({ boards: newList })
    } catch (err) {
      console.error('Error updating board position:', err) 
      alert(err)
    }
  }

  const addBoard = async () => {
    try {
      const res = await boardApi.create()
      console.log('Created board:', res) 
      const newList = [res, ...boards]
      dispatch(setBoards(newList))
      navigate(`/boards/${res._id}`)
    } catch (err) {
      console.error('Error adding board:', err) 
      alert(err)
    }
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
  }

  const filteredBoards = boards.filter(board => 
    board?.title?.toLowerCase().includes(searchQuery.toLowerCase()) || ''
  )

  console.log('Boards:', boards) 
  console.log('Filtered boards:', filteredBoards) 

  return (
    <Drawer
      container={window.document.body}
      variant='permanent'
      open={true}
      sx={{
        width: sidebarWidth,
        height: '100vh',
        '& > div': { borderRight: 'none' }
      }}
    >
      <List
        disablePadding
        sx={{
          width: sidebarWidth,
          height: '100vh',
          backgroundColor: assets.colors.secondary
        }}
      >
        <ListItem>
          <Box sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexDirection: 'column' 
          }}>
            <Typography variant='body1' fontWeight='700' sx={{ color: 'blue', fontSize: '1.75rem', mb: 1 }}>
              Melody Mesh
            </Typography>
            <Typography variant='body1' fontWeight='600' sx={{ fontSize: '1rem', mb: 1 }}>
              Organizer Handling
            </Typography>
            <Box sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant='body2' fontWeight='700' sx={{ color: 'lightblue', pt: '15px' }}>
                {user?.username || 'Guest'}
              </Typography>
              <IconButton onClick={logout}>
                <LogoutOutlinedIcon fontSize='small' />
              </IconButton>
            </Box>
          </Box>
        </ListItem>
        <Box sx={{ paddingTop: '10px' }} />

        <ListItem>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ mb: 0.05, mt: 0.05, ml: 0.02, mr: 0.02 }} 
          />
        </ListItem>
        <ListItem>
          <Box sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Typography variant='body2' fontWeight='700'>
              EVENTS
            </Typography>
            <IconButton onClick={addBoard}>
              <AddBoxOutlinedIcon fontSize='small' />
            </IconButton>
          </Box>
        </ListItem>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable key={'list-board-droppable-key'} droppableId={'list-board-droppable'}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {
                  filteredBoards.map((item, index) => (
                    <Draggable key={item?._id} draggableId={item?._id} index={index}>
                      {(provided, snapshot) => (
                        <ListItemButton
                          ref={provided.innerRef}
                          {...provided.dragHandleProps}
                          {...provided.draggableProps}
                          selected={index === activeIndex}
                          component={Link}
                          to={`/boards/${item?._id}`}
                          sx={{
                            pl: '20px',
                            cursor: snapshot.isDragging ? 'grab' : 'pointer!important'
                          }}
                        >
                          <Typography
                            variant='body2'
                            fontWeight='700'
                            sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {item?.icon || ''} {item?.title || ''}
                          </Typography>
                        </ListItemButton>
                      )}
                    </Draggable>
                  ))
                }
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <Box sx={{ paddingTop: '10px' }} />
        <FavouriteList />
      </List>
    </Drawer>
  )
}

export default Sidebar

