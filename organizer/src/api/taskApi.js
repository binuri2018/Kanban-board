import axiosClient from './axiosClient'

const taskApi = {
  create: (boardId, params) => axiosClient.post(`boards/${boardId}/tasks`, {
    ...params,
    closingDate: params.closingDate // Include closing date when creating a task
  }),
  updatePosition: (boardId, params) => axiosClient.put(
    `boards/${boardId}/tasks/update-position`,
    params
  ),
  delete: (boardId, taskId) => axiosClient.delete(`boards/${boardId}/tasks/${taskId}`),
  update: (boardId, taskId, params) => axiosClient.put(
    `boards/${boardId}/tasks/${taskId}`, {
      ...params,
      closingDate: params.closingDate // Include closing date when updating a task
    }
  )
}

export default taskApi
