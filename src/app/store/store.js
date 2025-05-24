import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import chatReducer from './chatSlice';
import appReducer from './appSlice';
import messageReducer from './messageSlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    app: appReducer,
    message: messageReducer,
  },
});

export default store;
