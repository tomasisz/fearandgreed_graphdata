import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

/* Sub-apps */
import FearGreedApp from './apps/fear-greed/App';
import TypingMasterApp from './apps/typing-master/App';
import PomodoroApp from './apps/pomodoro';

const Home = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1>Unified Workspace</h1>
      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <Link to="/fear-greed" style={cardStyle}>
          <h2>Fear & Greed</h2>
          <p>Crypto Market Sentiment</p>
        </Link>
        <Link to="/typing-master" style={cardStyle}>
          <h2>Typing Master</h2>
          <p>Practice Touch Typing</p>
        </Link>
        <Link to="/pomodoro" style={cardStyle}>
          <h2>Pomodoro</h2>
          <p>Focus Timer</p>
        </Link>
      </div>
    </div>
  );
};

const cardStyle = {
  display: 'block',
  padding: '2rem',
  border: '1px solid #ddd',
  borderRadius: '8px',
  textDecoration: 'none',
  color: 'inherit',
  width: '200px',
  textAlign: 'center' as const,
  transition: 'transform 0.2s',
  cursor: 'pointer',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Important: Sub-apps usage of Routes might need adjustments if they have their own Routers. 
            Ideally, they should just export a component that contains Routes with wildcard path if they handle internal routing.
        */}
        <Route path="/fear-greed/*" element={<FearGreedApp />} />
        <Route path="/typing-master/*" element={<TypingMasterApp />} />
        <Route path="/pomodoro/*" element={<PomodoroApp />} />
      </Routes>
    </Router>
  );
};

export default App;
