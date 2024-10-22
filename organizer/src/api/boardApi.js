import axiosClient from './axiosClient'

const boardApi = {
  create: async (boardData) => {
    const response = await axiosClient.post('/boards', boardData);
    return response.data;
  },
  getAll: () => axiosClient.get('boards'),
  updatePosition: (params) => axiosClient.put('boards', params),
  getOne: (id) => axiosClient.get(`boards/${id}`),
  delete: (id) => axiosClient.delete(`boards/${id}`),
  update: (id, params) => axiosClient.put(`boards/${id}`, params),
  getFavourites: () => axiosClient.get('boards/favourites'),
  updateFavouritePosition: (params) => axiosClient.put('boards/favourites', params)
}

export default boardApi
