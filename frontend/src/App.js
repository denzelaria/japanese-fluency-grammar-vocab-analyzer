import logo from './logo.svg';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import HomeScreen from './screens/HomeScreen';
function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomeScreen/>} exact/>
      </Routes>
    </Router>
  );
}

export default App;
