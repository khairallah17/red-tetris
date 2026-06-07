import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import gameReducer from "./reducers/gameReducer";
import boardReducer from "./reducers/boardReducer";

const rootReducer = combineReducers({
  game: gameReducer,
  board: boardReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
