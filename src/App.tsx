import React, { useState } from 'react';

export default function CalendarMVP() {
  const [teamInput, setTeamInput] = useState("Alice: DevOps\nBob: Backend, Database");
  const [constraintInput, setConstraintInput] = useState("Alice: DevOps = Monday");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  
  const [calendarDays, setCalendarDays] = useState([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsSolving(true);
    setHasGenerated(false);
    setError(null);

    // Parse Team Input
    const people = {};
    teamInput.split('\n').forEach(line => {
      if (line.includes(':')) {
        const [name, tasks] = line.split(':');
        people[name.trim()] = tasks.split(',').map(t => t.trim());
      }
    });

    // Parse Constraints (Format: "Alice: DevOps = Monday")
    const constraints = [];
    constraintInput.split('\n').forEach(line => {
      if (line.includes(':') && line.includes('=')) {
        const [personPart, rest] = line.split(':');
        const [domainPart, dayPart] = rest.split('=');
        constraints.push({
          person: personPart.trim(),
          domain: domainPart.trim(),
          day: dayPart.trim()
        });
      }
    });

    try {
      const response = await fetch('https://schedulesolver-api.onrender.com/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: parseInt(year), month: parseInt(month), people, constraints })
      });

      if (!response.ok) throw new Error("API Connection Failed. Is the Flask server running?");
      
      const csvText = await response.text();
      
      // Parse the CSV returned by Python
      const rows = csvText.split('\n').map(row => row.split(',')).filter(row => row.length === 3);
      // Remove header
      rows.shift(); 
      
      // Group tasks by day
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, tasks: [] }));
      
      rows.forEach(([d, person, task]) => {
        const dayNum = parseInt(d);
        if (dayNum && days[dayNum - 1]) {
          days[dayNum - 1].tasks.push({ person: person.trim(), task: task.trim() });
        }
      });

      setCalendarDays(days);
      setHasGenerated(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

  return (
    <div style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', maxWidth: '1000px', margin: '40px auto', padding: '0 20px', color: '#000000', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>Schedule Solver</h1>
      </header>

      {error && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', marginBottom: '20px', border: '1px solid #991b1b' }}>{error}</div>}

      <section style={{ marginBottom: '30px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Team & Domains</label>
          <textarea
            value={teamInput} onChange={(e) => setTeamInput(e.target.value)}
            style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #000', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="Name: Task1, Task2"
          />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Constraints</label>
          <textarea
            value={constraintInput} onChange={(e) => setConstraintInput(e.target.value)}
            style={{ width: '100%', height: '100px', padding: '12px', border: '1px solid #000', fontFamily: 'inherit', resize: 'vertical' }}
            placeholder="Name: Task = Monday"
          />
        </div>
      </section>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input type="number" value={month} onChange={(e) => setMonth(e.target.value)} min="1" max="12" style={{ padding: '10px', border: '1px solid #000', width: '80px' }} title="Month" />
        <input type="number" value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: '10px', border: '1px solid #000', width: '100px' }} title="Year" />
        <button 
          onClick={handleGenerate} disabled={isSolving}
          style={{ backgroundColor: isSolving ? '#f0f0f0' : '#000000', color: isSolving ? '#888888' : '#ffffff', padding: '10px 24px', border: '1px solid #000000', fontWeight: 'bold', cursor: isSolving ? 'wait' : 'pointer', flexGrow: 1 }}
        >
          {isSolving ? 'Solving OR-Tools Model...' : 'Run Solver via API'}
        </button>
      </div>

      {hasGenerated && !isSolving && (
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
            {daysOfWeek.map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>{day}</div>
            ))}
            
            {calendarDays.map(({ day, tasks }) => (
              <div key={day} style={{ minHeight: '120px', padding: '8px', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', paddingBottom: '4px' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {tasks.map((t, idx) => (
                    <div key={idx} style={{ fontSize: '12px', border: '1px solid #e0e0e0', padding: '4px 6px', backgroundColor: '#f9f9f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{t.person}:</strong> {t.task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}