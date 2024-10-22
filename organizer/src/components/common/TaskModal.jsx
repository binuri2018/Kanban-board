import { Backdrop, Fade, IconButton, Modal, Box, TextField, Typography, Divider, Snackbar, Alert, Button, Chip } from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import Moment from 'moment'
import { CKEditor } from '@ckeditor/ckeditor5-react'
import ClassicEditor from '@ckeditor/ckeditor5-build-classic'
import taskApi from '../../api/taskApi'

import '../../css/custom-editor.css'

const modalStyle = {
  outline: 'none',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '50%',
  bgcolor: 'background.paper',
  border: '0px solid #000',
  boxShadow: 24,
  p: 1,
  height: '80%'
}

let timer
const timeout = 500

const TaskModal = (props) => {
  const boardId = props.boardId
  const [task, setTask] = useState(props.task || null)
  const [title, setTitle] = useState(task?.title || '')
  const [content, setContent] = useState(task?.content || '')
  const [closingDate, setClosingDate] = useState(task?.closingDate || '') // Closing date state
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('') // Custom error messages
  const [isModalClosed, setIsModalClosed] = useState(false)
  const editorWrapperRef = useRef()

  useEffect(() => {
    if (props.task) {
      setTask(props.task)
      setTitle(props.task.title || '')
      setContent(props.task.content || '')
      setClosingDate(props.task.closingDate || '') // Set closing date if exists
      setIsModalClosed(false)
      updateEditorHeight()
    }
  }, [props.task])

  const updateEditorHeight = () => {
    setTimeout(() => {
      if (editorWrapperRef.current) {
        const box = editorWrapperRef.current
        box.querySelector('.ck-editor__editable_inline').style.height = `${box.offsetHeight - 50}px`
      }
    }, timeout)
  }

  const handleSnackbarClose = () => {
    setOpenSnackbar(false)
  }

  const handleUpdate = async (updatedFields) => {
    if (!task || !task.id) {
      console.error("Task or task ID is undefined.")
      return
    }

    clearTimeout(timer)
    timer = setTimeout(async () => {
      try {
        await taskApi.update(boardId, task.id, updatedFields)
      } catch (err) {
        console.error(err)
        setSnackbarMessage('An error occurred while updating the task.')
        setOpenSnackbar(true)
      }
    }, timeout)

    setTask(prev => ({ ...prev, ...updatedFields }))
  }

  const handleSave = async () => {
    // Save task with current state, including the closing date
    await handleUpdate({ title, content, closingDate })
    setIsModalClosed(true)
    props.onUpdate({ ...task, title, content, closingDate })
    props.onClose()
  }

  const updateTitle = (e) => {
    setTitle(e.target.value)
  }

  const updateContent = (event, editor) => {
    setContent(editor.getData())
  }

  const updateClosingDate = (e) => {
    const selectedDate = e.target.value

    // Validation: Ensure closing date is not before the task creation date
    if (Moment(selectedDate).isBefore(Moment(task.createdAt))) {
      setSnackbarMessage('Closing date cannot be earlier than the creation date.')
      setOpenSnackbar(true)
      return
    }

    setClosingDate(selectedDate) // Update closing date when valid
  }

  const deleteTask = async () => {
    if (!task || !task.id) {
      console.error("Task or task ID is undefined.")
      return
    }

    try {
      await taskApi.delete(boardId, task.id)
      setTask(null)
      setIsModalClosed(true)
      props.onDelete(task)
      props.onClose()
    } catch (err) {
      console.error(err)
      setSnackbarMessage('An error occurred while deleting the task.')
      setOpenSnackbar(true)
    }
  }

  const onClose = () => {
    if (!isModalClosed) {
      // Notify parent that the modal was closed without saving
      props.onUpdate(task)
    }
    props.onClose()
  }

  return (
    <>
      <Modal
        open={!!task && !isModalClosed}
        onClose={onClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={!!task && !isModalClosed}>
          <Box sx={modalStyle}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%' }}>
              <IconButton variant='outlined' color='error' onClick={deleteTask}>
                <DeleteOutlinedIcon />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', padding: '2rem 5rem 5rem', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <TextField
                  value={title}
                  onChange={updateTitle}
                  placeholder='Untitled'
                  variant='outlined'
                  fullWidth
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-input': { padding: 0 },
                    '& .MuiOutlinedInput-notchedOutline': { border: 'unset' },
                    '& .MuiOutlinedInput-root': { fontSize: '2.5rem', fontWeight: '700' }
                  }}
                />
                {closingDate && (
                  <Chip
                    icon={<AccessTimeIcon sx={{ color: 'red' }} />}
                    label={Moment(closingDate).format('MMM DD')}
                    sx={{
                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                      color: 'red',
                      fontWeight: 'bold',
                      marginLeft: '10px',
                    }}
                  />
                )}
              </Box>

              <Typography variant='body2' fontWeight='700'>
                {task ? Moment(task.createdAt).format('YYYY-MM-DD') : ''}
              </Typography>

              <TextField
                label="Closing Date"
                type="date"
                value={closingDate || ''} // Set the last saved closing date as default
                onChange={updateClosingDate}
                InputLabelProps={{
                  shrink: true
                }}
                fullWidth
                sx={{ 
                  marginTop: '2rem', 
                  marginBottom: '1.5rem'
                }}
              />
              <Divider sx={{ margin: '1.5rem 0' }} />
              <Box
                ref={editorWrapperRef}
                sx={{
                  position: 'relative',
                  height: '80%',
                  overflowX: 'hidden',
                  overflowY: 'auto'
                }}
              >
                <CKEditor
                  editor={ClassicEditor}
                  data={content}
                  onChange={updateContent}
                  onFocus={updateEditorHeight}
                  onBlur={updateEditorHeight}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button variant='contained' color='primary' onClick={handleSave}>
                  Save
                </Button>
              </Box>
            </Box>
          </Box>
        </Fade>
      </Modal>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  )
}

export default TaskModal
