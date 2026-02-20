import { useState, useEffect } from 'react';
import './App.css';

// Realistic-ish metrics for Gaudi3 max performance (FP8)
const MAX_TFLOPS = 1835;
const MAX_MEM_BW = 3700; // GB/s (HBM2e)

function App() {
  const [precision, setPrecision] = useState('FP8');
  const [batchSize, setBatchSize] = useState(128);
  const [seqLength, setSeqLength] = useState(2048);

  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState({ tflops: 0, bw: 0, util: 0 });

  const [log, setLog] = useState([
    "> System initialized.",
    "> Intel Gaudi 3 AI Accelerator Standby.",
    "> Awaiting workload configuration..."
  ]);

  const addLog = (msg) => {
    setLog(prev => [...prev, `> ${msg}`].slice(-6));
  };

  const executeWorkload = () => {
    if (isRunning) return;
    setIsRunning(true);
    addLog(`Compiling workload for ${precision}...`);
    addLog(`Optimal graph generated. Deploying to MMEs (Matrix Math Engines).`);

    // Simulate ramp up
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        clearInterval(interval);
        addLog("Workload execution complete.");
        setIsRunning(false);
        setMetrics({ tflops: 0, bw: 0, util: 0 });
        return;
      }

      // Calculate active metrics
      const complexity = (batchSize * seqLength) / (4096 * 128);
      const perfMultiplier = precision === 'FP8' ? 1.0 : (precision === 'BF16' ? 0.5 : 0.25);

      const jitter = 0.9 + Math.random() * 0.1;
      const tflops = Math.min((MAX_TFLOPS * perfMultiplier * complexity) * jitter, MAX_TFLOPS * perfMultiplier);
      const bw = Math.min((MAX_MEM_BW * complexity) * jitter, MAX_MEM_BW);
      const util = Math.min((complexity * 100) * jitter, 99.9);

      setMetrics({ tflops, bw, util });
    }, 100);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <div className="logo-area">
          <div className="intel-blue-dot"></div>
          <h1>Gaudi 3 <span>AI Compute Control</span></h1>
        </div>
        <div className="status-badge">
          Status: {isRunning ? <span className="active-txt">PROCESSING</span> : <span className="idle-txt">IDLE</span>}
        </div>
      </header>

      <main className="main-grid">
        {/* Left Column: Configuration */}
        <div className="panel config-panel">
          <h2>Workload Config</h2>

          <div className="form-group">
            <label>Precision Format: <span className="value-disp">{precision}</span></label>
            <div className="btn-group">
              <button
                className={precision === 'FP32' ? 'selected' : ''}
                onClick={() => !isRunning && setPrecision('FP32')}
              >FP32</button>
              <button
                className={precision === 'BF16' ? 'selected' : ''}
                onClick={() => !isRunning && setPrecision('BF16')}
              >BF16</button>
              <button
                className={precision === 'FP8' ? 'selected' : ''}
                onClick={() => !isRunning && setPrecision('FP8')}
              >FP8 (Fastest)</button>
            </div>
          </div>

          <div className="form-group">
            <label>Batch Size: <span className="value-disp">{batchSize}</span></label>
            <input
              type="range" min="1" max="512" value={batchSize}
              disabled={isRunning}
              onChange={(e) => setBatchSize(Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label>Sequence Length: <span className="value-disp">{seqLength}</span></label>
            <input
              type="range" min="512" max="8192" step="512" value={seqLength}
              disabled={isRunning}
              onChange={(e) => setSeqLength(Number(e.target.value))}
            />
          </div>

          <button
            className={`execute-btn ${isRunning ? 'running' : ''}`}
            onClick={executeWorkload}
            disabled={isRunning}
          >
            {isRunning ? 'EXECUTING KERNELS...' : 'ALLOCATE & RUN'}
          </button>
        </div>

        {/* Center Column: Architecture Visualizer */}
        <div className="panel visual-panel">
          <h2>Architecture Telemetry</h2>
          <div className="processor-diagram">
            <div className={`hbm left ${isRunning ? 'active' : ''}`}>HBM2e</div>

            <div className="core-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`mme-core ${isRunning ? `active-core-${i % 4}` : ''}`}>
                  MME + TPC
                </div>
              ))}
            </div>

            <div className={`hbm right ${isRunning ? 'active' : ''}`}>HBM2e</div>

            {/* Compute Flow Lines */}
            {isRunning && (
              <>
                <div className="data-flow flow-l"></div>
                <div className="data-flow flow-r"></div>
              </>
            )}
          </div>

          <div className="terminal">
            {log.map((line, i) => <div key={i} className="log-line">{line}</div>)}
          </div>
        </div>

        {/* Right Column: Live Metrics */}
        <div className="panel metrics-panel">
          <h2>Live Performance</h2>

          <div className="metric-box">
            <div className="metric-label">Compute (TFLOPS)</div>
            <div className="metric-value">{metrics.tflops.toFixed(1)}</div>
            <div className="metric-bar-bg">
              <div className="metric-bar fill-blue" style={{ width: `${(metrics.tflops / MAX_TFLOPS) * 100}%` }}></div>
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-label">Mem Bandwidth (GB/s)</div>
            <div className="metric-value">{metrics.bw.toFixed(0)}</div>
            <div className="metric-bar-bg">
              <div className="metric-bar fill-green" style={{ width: `${(metrics.bw / MAX_MEM_BW) * 100}%` }}></div>
            </div>
          </div>

          <div className="metric-box">
            <div className="metric-label">Compute Utilization</div>
            <div className="metric-value">{metrics.util.toFixed(1)}%</div>
            <div className="metric-bar-bg">
              <div className="metric-bar fill-purple" style={{ width: `${metrics.util}%` }}></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
