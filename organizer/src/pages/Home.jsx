import { Box } from "@mui/material";
import LoadingButton from '@mui/lab/LoadingButton';
import { useDispatch, useSelector } from "react-redux";
import { setBoards } from "../redux/features/boardSlice";
import { useNavigate } from "react-router-dom";
import boardApi from "../api/boardApi";
import { useState } from "react";

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const boards = useSelector((state) => state.board.value);

  const createBoard = async () => {
    setLoading(true);
    try {

      const boardData = {
        title: 'New Board',
        description: 'Description for your board'
      };

      const res = await boardApi.create(boardData);

      if (res && res._id) {
        dispatch(setBoards([...boards, res]));

        navigate(`/boards/${res._id}`);
      } else {
        console.error('Board creation failed: No ID returned from the server.');
        alert('Failed to create the board. Please try again.');
      }

    } catch (err) {
      console.error('Error creating board:', err);
      alert(err.response?.data?.message || 'An error occurred while creating the board.');

    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <LoadingButton
        variant='outlined'
        color='success'
        onClick={createBoard}
        loading={loading}
      >
        Click here to create your first board
      </LoadingButton>
    </Box>
  );
};

export default Home;

